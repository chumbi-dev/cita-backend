import AWS from 'aws-sdk';
import { Appointment } from '../../domain/Appointment';

export class SnsPublisher {
  private readonly sns = new AWS.SNS();
  private readonly topicArn = process.env.SNS_TOPIC_ARN!;

  async publish(appointment: Appointment): Promise<void> {
    await this.sns.publish({
      TopicArn: this.topicArn,
      Message: JSON.stringify(appointment),
      MessageAttributes: {
        countryISO: {
          DataType: 'String',
          StringValue: appointment.countryISO,
        },
      },
    }).promise();
  }
}
