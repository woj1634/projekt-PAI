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
    res.status(500).json({ error: "Błąd pobierania" });
  }
});

app.post('/api/events', async (req, res) => {
  try {
    const newEvent = new Event(req.body);
    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (err) {
    res.status(500).json({ error: "Błąd zapisu" });
  }
});

app.put('/api/events/:id', async (req, res) => {
  try {
    const updated = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Błąd edycji" });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Błąd usuwania" });
  }
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend działa na porcie ${PORT}`);
});