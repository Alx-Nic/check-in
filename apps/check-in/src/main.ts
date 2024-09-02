import express from 'express';
import { PrismaClient } from '@prisma/client';
import notifier from 'node-notifier';
import morgan from 'morgan';
const prisma = new PrismaClient();

const host = process.env.HOST ?? '0.0.0.0';
const port = process.env.PORT ? Number(process.env.PORT) : 3500;

const app = express();
app.use(express.json());
// Use morgan middleware for logging
app.use(morgan('dev')); // or 'dev', 'short', 'tiny', etc.

app.get('/', async (req, res) => {
  return res.json({ message: 'Hello API' });
});

app.get('/check-in', async (req, res) => {
  const result = await prisma.checkIn.findMany({});

  return res.json(result);
});

app.get('/check-in/clear', async (req, res) => {
  const result = await prisma.checkIn.deleteMany({});

  return res.json(result);
});

app.delete('/check-in/:id', async (req, res) => {
  const checkingInId = Number(req.params.id);

  if (isNaN(checkingInId)) {
    return res.status(400).json({ message: 'Invalid id' });
  }

  try {
    const result = await prisma.checkIn.delete({
      where: {
        id: checkingInId,
      },
    });

    console.log('deleted', result);

    return res.json(result);
  } catch (error) {
    console.log(error);
    return res.json({ message: 'Error' });
  }
});

app.post('/check-in', async (req, res) => {
  if (!req.body.operation || !req.body.date) {
    console.log('post-check-in', req.body);

    return res.status(400).json({ message: 'Missing operation or date' });
  }

  try {
    const date = new Date(req.body.date);
    const result = await prisma.checkIn.create({
      data: {
        operation: req.body.operation,
        date: date.toISOString(),
      },
    });

    if (result) {
      console.log('post result', result);

      notifier.notify({
        title: 'Check-in',
        message: `Check in:${result.operation} - ${result.date}`,
        sound: true,
      });
    }

    return res.json(result);
  } catch (error) {
    console.log(error);
    return res.json({ message: 'Error' });
  }
});

app.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});
