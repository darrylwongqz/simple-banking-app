# Simple Banking App

A RESTful API built with [NestJS](https://nestjs.com/) that simulates basic banking operations. The app allows you to manage users, create bank accounts, and perform transactions (deposits, withdrawals, transfers). Every operation is logged, and you can audit all transactions through a dedicated endpoint.

**Full Video Demo** at [here](https://drive.google.com/file/d/1g8Gn7GrvqMpQ5MAcuoP8gbtim_mDwL7d/view?usp=sharing)

---

## 1. Introduction

The Simple Banking App is designed to demonstrate a clean, modular REST API built with NestJS. It includes:

- **User Management:** Create and retrieve users.
- **Account Management:** Create bank accounts for users. The same user cannot create multiple accounts with the same name.
- **Transactions:** Perform deposits, withdrawals, and transfers between accounts. All operations are logged as transactions.
- **Audit:** Retrieve all transactions for auditing purposes.
- **Precision Handling:** Monetary amounts are managed using BigNumber and accepted as strings to preserve decimal precision.
- **Swagger Documentation:** Interactive API docs generated via Swagger.

---

## 2. Running in Production Mode (if you have Node.js installed)

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Build the application:**
   ```bash
   npm run build
   ```
3. **Start in production mode:**
   ```bash
   npm run start:prod
   ```
The app will run on [http://localhost:3000](http://localhost:3000) by default.

You can access the swagger interface to access the api at [http://localhost:3000/api](http://localhost:3000/api)

## 2.1 Running with Docker

You can run the application using Docker without installing Node.js locally:

### Option 1: Using the run.sh Script (Easiest)

1. Make sure you have [Docker](https://www.docker.com/get-started) installed on your system.

2. Clone the repository and navigate to the project directory:
   ```bash
   git clone <repository-url>
   cd simple-banking-app
   ```

3. Make the run script executable and run it:
   ```bash
   chmod +x run.sh
   ./run.sh
   ```

4. The script will automatically detect if you have Docker Compose installed and use the appropriate method.

5. Access the Swagger UI at http://localhost:3000/api in your browser.

6. To stop the application, press Ctrl+C in the terminal.

### Option 2: Using Docker Compose

1. Make sure you have [Docker](https://www.docker.com/get-started) and Docker Compose installed on your system.

2. Clone the repository and navigate to the project directory.

3. Run the application with Docker Compose:
   ```bash
   docker compose up
   ```

4. Access the Swagger UI at http://localhost:3000/api in your browser.

5. To stop the application, press Ctrl+C in the terminal or run:
   ```bash
   docker compose down
   ```

### Option 3: Using Docker Directly

1. Build the Docker image:
   ```bash
   docker build -t simple-banking-app .
   ```

2. Run the container:
   ```bash
   docker run -p 3000:3000 simple-banking-app
   ```

3. Access the Swagger UI at http://localhost:3000/api in your browser.

---

## 3. Running in Development Mode

For development with hot-reloading:

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Start in development mode:**
   ```bash
   npm run start:dev
   ```
The app will run on [http://localhost:3000](http://localhost:3000) and auto-reload on code changes.

You can access the swagger interface to access the api at [http://localhost:3000/api](http://localhost:3000/api)

---

## 4. Running Automated Tests

### Unit and Integration Tests - 99.51% coverage

- **Run unit tests:**
  ```bash
  npm run test
  ```
- **Run test coverage:**
  ```bash
  npm run test:cov
  ```

### End-to-End (e2e) Tests

- **Run e2e tests:**
  ```bash
  npm run test:e2e
  ```

---

## 5. Manual Testing with Swagger

1. **Start the application** (in development or production mode).
2. **Open Swagger UI** by navigating to [http://localhost:3000/api](http://localhost:3000/api).

### Testing Steps via Swagger

1. **Create Users:**
   - Use the `POST /users` endpoint to create two users:
     - **User 1:**
       ```json
       {
         "name": "John Doe",
         "email": "john@example.com"
       }
       ```
     - **User 2:**
       ```json
       {
         "name": "Jane Smith",
         "email": "jane@example.com"
       }
       ```
   - Note the returned `userId` for each user.

2. **Create Bank Accounts:**
   - Use the `POST /accounts` endpoint to create accounts:
     - **Account for User 1:**
       ```json
       {
         "name": "John's Savings",
         "ownerUserId": "user1-id-from-step-1",
         "startingBalance": "1000.00"
       }
       ```
     - **Account for User 2:**
       ```json
       {
         "name": "Jane's Checking",
         "ownerUserId": "user2-id-from-step-1",
         "startingBalance": "500.00"
       }
       ```
   - Note the `accountId` from each response.

3. **Perform Transactions:**
   - **Deposit:**  
     Use `POST /accounts/{accountId}/deposit` with:
     ```json
     {
       "userId": "user1-id-from-step-1",
       "amount": "250.00"
     }
     ```
   - **Withdrawal:**  
     Use `POST /accounts/{accountId}/withdraw` with:
     ```json
     {
       "userId": "user1-id-from-step-1",
       "amount": "100.00"
     }
     ```
   - **Transfer:**  
     Use `POST /accounts/transfer` with:
     ```json
     {
       "userId": "user1-id-from-step-1",
       "fromAccountId": "account1-id-from-step-2",
       "toAccountId": "account2-id-from-step-2",
       "amount": "200.00"
     }
     ```

4. **Test Error Handling:**
   - **Insufficient Funds:**  
     Test the application's handling of withdrawal or transfer attempts that exceed available funds:
     ```json
     {
       "userId": "user1-id-from-step-1",
       "amount": "5000.00"  // Amount greater than account balance
     }
     ```
     The API should return a 400 Bad Request with a message about insufficient funds.
   
   - **Same Account Transfer:**  
     Attempt to transfer money to the same account:
     ```json
     {
       "userId": "user1-id-from-step-1",
       "fromAccountId": "account1-id",
       "toAccountId": "account1-id",  // Same as fromAccountId
       "amount": "100.00"
     }
     ```
     The API should return a 400 Bad Request indicating that transfers to the same account are not allowed.

   - **View Transaction History:**  
     Get transaction history for an account:
     ```
     GET /accounts/{accountId}/transactions?userId={userId}
     ```
     This will return all transactions for the specified account.

   - **View All Transactions (Audit):**  
     For audit purposes, use:
     ```
     GET /transactions
     ```
     This endpoint provides a complete transaction log for the entire system.

## Authentication Note

This is a demonstration application that uses `userId` in the request body for simplicity. In a production environment:

- User authentication would utilize JWT (JSON Web Tokens) or similar authentication mechanisms
- User identification and authorization would be handled through request headers, not request body
- Sensitive operations would require proper authentication tokens rather than passing user IDs directly
- Additional security measures like rate limiting, request validation, and audit logging would be implemented

The current implementation focuses on demonstrating the banking business logic rather than security practices.

## Domain-Driven Design Approach

The application follows some principles of Domain-Driven Design (DDD), particularly with the `BankAccount` entity:

- **Rich Domain Model**: The `BankAccount` entity contains business methods like `deposit()` and `withdraw()` rather than being a simple data container. This is in contrast to the `User` and `Transaction` entities which are more data-centric.

- **Encapsulation of Business Rules**: The `BankAccount` entity encapsulates critical business rules such as:
  - Preventing negative balances during withdrawals
  - Validating transaction amounts
  - Managing the account balance

- **Logic in Entity vs. Service Layer**: While many applications put all business logic in service layers, this design deliberately places account-specific operations in the entity itself because:
  1. These operations directly affect the entity's state (balance)
  2. Business rules about balance management are intrinsic to what an account *is*, not just what it *does*
  3. This creates a more maintainable codebase where account-specific logic isn't spread across multiple services

This pattern ensures that the core domain logic can't be bypassed and that account balance modifications always follow the required business rules, regardless of which service is using the entity.

---

## 6. Project Structure

```
simple-banking-app/
├── src/                           # Source code
│   ├── app.module.ts              # Main application module
│   ├── main.ts                    # Application entry point
│   │
│   ├── bank/                      # Bank module (accounts & transactions)
│   │   ├── bank.controller.ts     # Controller for account operations
│   │   ├── bank.module.ts         # Bank module definition
│   │   ├── bank.service.ts        # Service for account operations
│   │   ├── dto/                   # Data Transfer Objects
│   │   └── entities/              # Account entity definitions
│   │
│   ├── user/                      # User module
│   │   ├── user.controller.ts     # Controller for user operations
│   │   ├── user.module.ts         # User module definition
│   │   ├── user.service.ts        # Service for user operations
│   │   ├── dto/                   # Data Transfer Objects
│   │   └── entities/              # User entity definitions
│   │
│   ├── transaction/               # Transaction module
│   │   ├── transaction.controller.ts  # Controller for transaction queries
│   │   ├── transaction.module.ts      # Transaction module definition
│   │   ├── transaction.service.ts     # Service for transaction operations
│   │   └── entities/                  # Transaction entity definitions
│   │
│   └── common/                    # Shared code
│       ├── validators/            # Custom validators
│       └── interfaces/            # Shared interfaces
│
├── test/                          # End-to-end tests
│   ├── app.e2e-spec.ts            # Application e2e tests
│   ├── user.e2e-spec.ts           # User module e2e tests
│   ├── bank.e2e-spec.ts           # Bank module e2e tests
│   └── transaction.e2e-spec.ts    # Transaction module e2e tests
│
├── package.json                   # Project dependencies
├── tsconfig.json                  # TypeScript configuration
└── README.md                      # Project documentation
```

---

## 7. Entity Relationship Diagram (ERD)

```
┌─────────────┐       ┌──────────────┐       ┌────────────────┐
│    User     │       │  BankAccount  │       │  Transaction   │
├─────────────┤       ├──────────────┤       ├────────────────┤
│ userId (PK) │───┐   │ accountId(PK)│───┐   │transactionId(PK)│
│ name        │   │   │ name         │   │   │amount           │
│ email       │   │   │ balance      │   │   │transactionType  │
└─────────────┘   │   │ ownerUserId  │◄──┘   │timestamp        │
                  │   │ (FK to User) │       │accountId        │
                  │   └──────────────┘       │(FK to Account)  │
                  │                          │description      │
                  └─────────────────────────►│relatedAccountId │
                                             │                 │
                                             └────────────────┘
```

Legend:
- User: Represents a bank customer
- BankAccount: Represents a bank account owned by a user
- Transaction: Represents financial transactions on accounts
  - Types include: INITIAL_DEPOSIT, DEPOSIT, WITHDRAWAL, TRANSFER_IN, TRANSFER_OUT

Relationships:
- One User can have many BankAccounts (1:N)
- One BankAccount can have many Transactions (1:N)
- Transactions can reference other accounts (for transfers)

---
