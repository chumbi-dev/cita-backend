import { APIGatewayProxyHandler } from 'aws-lambda';
import AWS from 'aws-sdk';

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.DYNAMO_TABLE || 'AppointmentsTable';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const insuredId = event.pathParameters?.insuredId;

    if (!insuredId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'El parámetro insuredId es requerido' }),
      };
    }

    const result = await dynamoDb.query({
      TableName: tableName,
      KeyConditionExpression: 'insuredId = :id',
      ExpressionAttributeValues: {
        ':id': insuredId,
      },
    }).promise();

    return {
      statusCode: 200,
      body: JSON.stringify(result.Items || []),
    };
  } catch (error) {
    console.error('Error en getAppointments:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};

