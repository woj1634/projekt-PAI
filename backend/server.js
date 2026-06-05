const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
  console.error("KRYTYCZNY BŁĄD: Brak zmiennej MONGO_URI w środowisku!");
  process.exit(1);
}

const connectionOptions = {
  ssl: true,
  retryWrites: false,
  directConnection: true, 
  family: 4               
};

console.log("Próba połączenia z Azure Cosmos DB...");
mongoose.connect(mongoURI, connectionOptions)
  .then(() => {
    console.log("SUKCES: Połączono bezpiecznie z Azure Cosmos DB!");
    mongoose.set('bufferCommands', false); 
  })
  .catch(err => {
    console.error("KRYTYCZNY BŁĄD połączenia z bazą Cosmos DB:", err);
    process.exit(1);
  });

const EventSchema = new mongoose.Schema({
  title: String,
  start: String
});

EventSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {   
    ret.id = ret._id.toString();
    delete ret._id;
  }
});

const Event = mongoose.model('Event', EventSchema);

app.get('/api/events', async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (err) {
    console.error("Błąd podczas pobierania wydarzeń:", err);
    res.status(500).json({ error: "Nie udało się pobrać danych z bazy", details: err.message });
  }
});