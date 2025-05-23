/*
  Second refactoring: inversion of control
  I transform the impure functions into dependencies
*/

import * as fs from 'fs'

class Employee {
  constructor(
    readonly lastName: string,
    readonly firstName: string,
    readonly dateOfBirth: Date,
    readonly email: string
  ) {}
  isBirthday(today: Date): boolean {
    return (
      this.dateOfBirth.getMonth() === today.getMonth() &&
      this.dateOfBirth.getDate() === today.getDate()
    )
  }
}

class Email {
  constructor(
    readonly from: string,
    readonly subject: string,
    readonly body: string,
    readonly recipient: string
  ) {}
}

//
// ports
//

interface EmailService {
  readonly sendMessage: (email: Email) => void
}

interface FileSystemService {
  readonly read: (fileName: string) => string
}

interface AppService extends EmailService, FileSystemService {}

// pure
const toEmail = (employee: Employee): Email => {
  const recipient = employee.email
  const body = `Happy Birthday, dear ${employee.firstName}!`
  const subject = 'Happy Birthday!'
  return new Email('sender@here.com', subject, body, recipient)
}

// pure
const getGreetings = (
  today: Date,
  employees: ReadonlyArray<Employee>
): ReadonlyArray<Email> => {
  return employees.filter((e) => e.isBirthday(today)).map(toEmail)
}

// pure
const parse = (input: string): ReadonlyArray<Employee> => {
  const lines = input.split('\n').slice(1) // skip header
  return lines.map((line) => {
    const employeeData = line.split(', ')
    return new Employee(
      employeeData[0],
      employeeData[1],
      new Date(employeeData[2]),
      employeeData[3]
    )
  })
}

// impure
const sendGreetings = (services: AppService) => (
  fileName: string,
  today: Date
): void => {
  const input = services.read(fileName)
  const employees = parse(input)
  const emails = getGreetings(today, employees)
  emails.forEach((email) => services.sendMessage(email))
}

//
// adapters
//

const getAppService = (smtpHost: string, smtpPort: number): AppService => {
  return {
    sendMessage: (email: Email): void => {
      console.log(smtpHost, smtpPort, email)
    },
    read: (fileName: string): string => {
      return fs.readFileSync(fileName, { encoding: 'utf8' })
    }
  }
}

const program = sendGreetings(getAppService('localhost', 80))
program('src/onion-architecture/employee_data.txt', new Date(2008, 9, 8))
/*
localhost 80 Email {
  from: 'sender@here.com',
  subject: 'Happy Birthday!',
  body: 'Happy Birthday, dear John!',
  recipient: 'john.doe@foobar.com' }
*/
