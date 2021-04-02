const { Client } = require('pg');

const client = new Client({
  connectionString: "postgres://mhdhotsqsizrlw:91643deec222671ddd0dd61a49cc560ebcb8b3b122bd5c35efd0bc35811c5c26@ec2-107-20-155-148.compute-1.amazonaws.com:5432/d40pns77a3hacf",
  ssl: {
    rejectUnauthorized: false
  }
});

client.connect();

client.query('SELECT * FROM BotData;', (err, res) => {
  if (err) throw err;
  for (let row of res.rows) {
    console.log(JSON.stringify(row));
  }
  client.end();
});
