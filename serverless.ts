import type { AWS } from '@serverless/typescript';

const serverlessConfiguration: AWS = {
  service: 'cita-backend',
  frameworkVersion: '3',
  plugins: ['serverless-plugin-typescript'],
  provider: {
    name: 'aws',
    runtime: 'nodejs18.x',
    region: 'us-east-1',
    stage: 'dev',
    environment: {
      DYNAMO_TABLE: 'AppointmentsTable',
      SNS_TOPIC_ARN: { Ref: 'AppointmentsTopic' },
      SQS_QUEUE_PE_URL: { Ref: 'QueuePE' },
      SQS_QUEUE_CL_URL: { Ref: 'QueueCL' },
      EVENT_BUS_NAME: { Ref: 'AppointmentEventBus' },
      MYSQL_USER: 'admin',
      MYSQL_PASSWORD: 'Admin123456!',
      MYSQL_PE_HOST: 'mysql-pe.cmkemsfcy6xq.us-east-1.rds.amazonaws.com',
      MYSQL_CL_HOST: 'mysql-cl.cmkemsfcy6xq.us-east-1.rds.amazonaws.com',
      MYSQL_DB_PE: 'citas_pe',
      MYSQL_DB_CL: 'citas_cl'
    },
    iamRoleStatements: [
      {
        Effect: 'Allow',
        Action: [
          'dynamodb:*',
          'sns:Publish',
          'sqs:*',
          'events:*'
        ],
        Resource: '*'
      }
    ]
  },
  functions: {
    createAppointment: {
      handler: 'src/handlers/appointment.createAppointment',
      events: [
        {
          http: {
            path: 'appointments',
            method: 'post',
            cors: true
          }
        }
      ]
    },
    getAppointments: {
      handler: 'src/handlers/getAppointments.handler',
      events: [
        {
          http: {
            path: 'appointments/{insuredId}',
            method: 'get',
            cors: true
          }
        }
      ]
    },
    processAppointmentPE: {
      handler: 'src/handlers/appointment_pe.handler',
      events: [
        {
          sqs: {
            arn: { 'Fn::GetAtt': ['QueuePE', 'Arn'] }
          }
        }
      ]
    },
    processAppointmentCL: {
      handler: 'src/handlers/appointment_cl.handler',
      events: [
        {
          sqs: {
            arn: { 'Fn::GetAtt': ['QueueCL', 'Arn'] }
          }
        }
      ]
    },
    handleEventBridgeResponse: {
      handler: 'src/handlers/eventbridge.handler',
      events: [
        {
          eventBridge: {
            eventBus: { Ref: 'AppointmentEventBus' },
            pattern: {
              source: ['appointment.result']
            }
          }
        }
      ]
    }
  },
  resources: {
    Resources: {
      AppointmentsTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: 'AppointmentsTable',
          AttributeDefinitions: [
            { AttributeName: 'insuredId', AttributeType: 'S' },
            { AttributeName: 'createdAt', AttributeType: 'S' }
          ],
          KeySchema: [
            { AttributeName: 'insuredId', KeyType: 'HASH' },
            { AttributeName: 'createdAt', KeyType: 'RANGE' }
          ],
          BillingMode: 'PAY_PER_REQUEST'
        }
      },
      AppointmentsTopic: {
        Type: 'AWS::SNS::Topic',
        Properties: {
          TopicName: 'AppointmentsTopic'
        }
      },
      QueuePE: {
        Type: 'AWS::SQS::Queue',
        Properties: {
          QueueName: 'SQS_PE'
        }
      },
      QueueCL: {
        Type: 'AWS::SQS::Queue',
        Properties: {
          QueueName: 'SQS_CL'
        }
      },
      SNSTopicSubscriptionPE: {
        Type: 'AWS::SNS::Subscription',
        Properties: {
          Protocol: 'sqs',
          TopicArn: { Ref: 'AppointmentsTopic' },
          Endpoint: { 'Fn::GetAtt': ['QueuePE', 'Arn'] },
          FilterPolicy: {
            countryISO: ['PE']
          },
          RawMessageDelivery: true
        }
      },
      SNSTopicSubscriptionCL: {
        Type: 'AWS::SNS::Subscription',
        Properties: {
          Protocol: 'sqs',
          TopicArn: { Ref: 'AppointmentsTopic' },
          Endpoint: { 'Fn::GetAtt': ['QueueCL', 'Arn'] },
          FilterPolicy: {
            countryISO: ['CL']
          },
          RawMessageDelivery: true
        }
      },
      QueuePolicyPE: {
        Type: 'AWS::SQS::QueuePolicy',
        Properties: {
          Queues: [{ Ref: 'QueuePE' }],
          PolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: '*',
                Action: 'SQS:SendMessage',
                Resource: { 'Fn::GetAtt': ['QueuePE', 'Arn'] },
                Condition: {
                  ArnEquals: {
                    'aws:SourceArn': { Ref: 'AppointmentsTopic' }
                  }
                }
              }
            ]
          }
        }
      },
      QueuePolicyCL: {
        Type: 'AWS::SQS::QueuePolicy',
        Properties: {
          Queues: [{ Ref: 'QueueCL' }],
          PolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: '*',
                Action: 'SQS:SendMessage',
                Resource: { 'Fn::GetAtt': ['QueueCL', 'Arn'] },
                Condition: {
                  ArnEquals: {
                    'aws:SourceArn': { Ref: 'AppointmentsTopic' }
                  }
                }
              }
            ]
          }
        }
      },
      AppointmentEventBus: {
        Type: 'AWS::Events::EventBus',
        Properties: {
          Name: 'AppointmentEventBus'
        }
      }
    }
  }
};

module.exports = serverlessConfiguration;
