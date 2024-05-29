# Simple Blog
This project is a simple blog website developed to learn server-side development using Node.js and Express, as well as to understand how to connect and interact with MongoDB.

## Technologies Used
* Node.js: For server-side JavaScript runtime.
* Express: For web application framework.
* MongoDB: For the database to store user accounts, categories, and postings.

## Features
1. User Authentication:
* Sign up for an account.
* Log in using your account credentials.

2. Category Management:
* Create categories to organize blog postings.

3. Data Storage:
* Store user accounts, categories, and postings in a MongoDB database.

4. Data Management:
* Delete any data, including user accounts and postings.

## How to start
1. Install npm package
   ```
   npm install
   ```

2. Install express
   ```
   npm install express
   ```
   
3. Ensure MongoDB is running
   * Make sure you have MongoDB installed and running on your machine.
   * Create a new database for your blog.
     
4. Configure environment variables
   * Create a '.env' file in the root of your project.
   * Add the following variables to the '.env' file:
    ```
    PORT=8080
    MONGODB_URI=your_mongodb_connection_string
    ```
    
5. Run server
   ```
   node server.js
   ```
   
6. Navigate to “http://localhost:8080/”
