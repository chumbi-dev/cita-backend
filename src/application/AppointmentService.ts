import { Appointment } from '../domain/Appointment';
import { AppointmentRepository } from '../infrastructure/dynamo/AppointmentRepository';
import { SnsPublisher } from '../infrastructure/sns/SnsPublisher';

export class AppointmentService {
  constructor(private readonly repository: AppointmentRepository) {}

  async create(appointment: Appointment): Promise<void> {
    await this.repository.save(appointment);
    const publisher = new SnsPublisher();
    await publisher.publish(appointment);
  }
}
