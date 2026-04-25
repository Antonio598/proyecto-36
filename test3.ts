import prisma from './src/lib/prisma';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';

async function run() {
  const cals = await prisma.calendar.findMany();
  const cal = cals[0];
  if (!cal) return console.log('No calendars found');
  
  const rules = await prisma.availabilityRule.findMany({ where: { calendarId: cal.id } });
  console.log('RULES FOR CALENDAR:', rules);

  if (rules.length > 0) {
     const rule = rules[0]; // let's test the day of the first rule
     const testStart = new Date();
     const panamaDate = toZonedTime(testStart, 'America/Panama');
     
     const panamaDateStr = format(panamaDate, 'yyyy-MM-dd');
     const workStart = fromZonedTime(`${panamaDateStr}T${rule.startTime}:00`, 'America/Panama');
     const workEnd = fromZonedTime(`${panamaDateStr}T${rule.endTime}:00`, 'America/Panama');

     console.log('workStart (UTC):', workStart);
     console.log('workEnd (UTC):', workEnd);
     console.log('testStart (UTC):', testStart);
     
     if (testStart < workStart || testStart > workEnd) {
         console.log('OUT OF BOUNDS!');
     } else {
         console.log('WITHIN BOUNDS!');
     }
  }
}
run().finally(() => {});
