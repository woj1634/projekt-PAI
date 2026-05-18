const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/kalendarz';
mongoose.connect(mongoURI)
  .then(() => console.log("Połączono z MongoDB"))
  .catch(err => console.error("Błąd połączenia z bazą:", err));

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
  const events = await Event.find();
  res.json(events);
});

app.post('/api/events', async (req, res) => {
  const newEvent = new Event(req.body);
  await newEvent.save();
  res.status(201).json(newEvent);
});

app.delete('/api/events/:id', async (req, res) => {
  await Event.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

app.put('/api/events/:id', async (req, res) => {
  await Event.findByIdAndUpdate(req.params.id, req.body);
  res.json({ success: true });
});

app.listen(5000, () => console.log('Backend na porcie 5000'));