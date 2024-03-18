const { Client } = require("pg");
const readline = require("readline");

const rline = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function promptForCredentials() {
  return new Promise((resolve) => {
    rline.question("Enter the database name: ", (dbName) => {
      rline.question("Enter your username: ", (user) => {
        rline.question("Enter your password: ", (password) => {
          resolve({ dbName, user, password: String(password) });
        });
      });
    });
  });
}

async function connectToDb({ dbName, user, password }) {
  const client = new Client({
    database: dbName,
    user: user,
    password: password,
  });

  try {
    await client.connect();
    return client;
  } catch (error) {
    console.error("Connection failed: ", error);
    return null;
  }
}

async function main(client) {
  console.log("\n1. Get all students");
  console.log("2. Add new student");
  console.log("3. Update student email");
  console.log("4. Delete a student");
  console.log("5. Quit\n");

  rline.question("Enter your choice: ", async (choice) => {
    switch (choice) {
      case "1":
        await getAllStudents(client);
        break;
      case "2":
        await addNewStudent(client);
        break;
      case "3":
        await updateStudentEmail(client);
        break;
      case "4":
        await deleteStudent(client);
        break;
      case "5":
        console.log("Exiting program.");
        rline.close();
        client.end();
        return;
      default:
        console.log("Invalid choice. Please try again.");
    }
    await main(client);
  });
}

async function getAllStudents(client) {
  const res = await client.query("SELECT * FROM students;");
  console.log(res.rows);
}

async function addNewStudent(client) {
  rline.question("Enter student first name: ", (firstName) => {
    rline.question("Enter student last name: ", (lastName) => {
      rline.question("Enter student email: ", (email) => {
        rline.question(
          "Enter enrollment date (YYYY-MM-DD): ",
          async (enrollmentDate) => {
            const query =
              "INSERT INTO students (first_name, last_name, email, enrollment_date) VALUES ($1, $2, $3, $4);";
            try {
              await client.query(query, [
                firstName,
                lastName,
                email,
                enrollmentDate,
              ]);
              console.log("New student added successfully.");
            } catch (error) {
              console.error("Failed to add new student:", error);
            }
            await main(client);
          }
        );
      });
    });
  });
}

async function updateStudentEmail(client) {
  rline.question('Enter student ID whose email you want to update: ', (studentId) => {
    rline.question('Enter new email: ', async (newEmail) => {
      const query = 'UPDATE students SET email = $1 WHERE student_id = $2;';
      try {
        const res = await client.query(query, [newEmail, studentId]);
        if (res.rowCount > 0) {
          console.log(`Email of student with ID ${studentId} updated successfully.`);
        } else {
          console.log(`Student with ID ${studentId} not found.`);
        }
      } catch (error) {
        console.error('Failed to update student email:', error);
      }
      await main(client);
    });
  });
}

async function deleteStudent(client) {
  rline.question('Enter student ID to delete: ', async (studentId) => {
    const query = 'DELETE FROM students WHERE student_id = $1;';
    try {
      const res = await client.query(query, [studentId]);
      if (res.rowCount > 0) {
        console.log(`Student with ID ${studentId} deleted successfully.`);
      } else {
        console.log(`Student with ID ${studentId} not found.`);
      }
    } catch (error) {
      console.error('Failed to delete student:', error);
    }
    await main(client);
  });
}

async function init() {
  const cred = await promptForCredentials();
  const client = await connectToDb(cred);

  if (client) {
    await main(client);
  } else {
    console.log("Please check your database details and try again.");
    rline.close();
  }
}

init();
