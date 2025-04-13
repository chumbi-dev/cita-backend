import { EventBridgeEvent } from 'aws-lambda';
import AWS from 'aws-sdk';

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.DYNAMO_TABLE || 'AppointmentsTable';

export const handler = async (event: EventBridgeEvent<'appointment.result', any>) => {
  const { insuredId, createdAt } = event.detail;

  await dynamoDb.update({
    TableName: tableName,
    Key: { insuredId, createdAt },
    UpdateExpression: 'SET #s = :s',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: { ':s': 'completed' }
  }).promise();

  console.log(`Estado actualizado a completed para ${insuredId}`);
};
