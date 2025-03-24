export class User {
  userId: string;
  name: string;
  email: string;
  createdAt: Date;

  constructor(userId: string, name: string, email: string) {
    this.userId = userId;
    this.name = name;
    this.email = email;
    this.createdAt = new Date();
  }
}
