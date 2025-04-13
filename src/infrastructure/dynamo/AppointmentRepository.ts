import AWS from 'aws-sdk';
import { Appointment } from '../../domain/Appointment';

export class AppointmentRepository {
  private readonly dynamoDb = new AWS.DynamoDB.DocumentClient();
  private readonly tableName = process.env.DYNAMO_TABLE!;

  async save(appointment: Appointment): Promise<void> {
    await this.dynamoDb.put({
      TableName: this.tableName,
      Item: appointment,
    }).promise();
  }
}
