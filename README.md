# Church Analytics App

This application serves to provide member insights for a church body by tracking attendance over time using an easy to use and intuitive interface. You can track attendance on any custom event and view the trends over time. One can also see distributions of gender, age and other demographics.

This is to provide a church insight on their members so that they can tailor their services accordingly.

# Database

The database consists of 5 tables

- User
- Members
- Attendance
- Events
- Updates

Where the **User** table is a table of all app users. This is used for login and data filterin purposes. For example, if you are a user from a specified church you will only see the data for that specified church on the application interface.

The **Member** table is a table of all members of your church.

the **Updates** table keeps track of any member updates created over time as an audit list of how member data has changed over time.

The **Attendance** table is a simple table that tracks member attendance over time. Everytime you input attendance it saves on the attendance table.

The **Events** table is a table of events that the user wishes to track attendance for. These events can be created on the fly in the app.
