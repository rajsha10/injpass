import { getTicketByOwner } from './db.js';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  const address = '0x55dc27721cccbae0195f1f4156c3ae85a8461968';
  console.log('Testing getTicketByOwner for:', address);
  try {
    const ticket = await getTicketByOwner(address);
    console.log('Result from getTicketByOwner:', ticket);
  } catch (err) {
    console.error('Error executing getTicketByOwner:', err);
  }
}

run();
