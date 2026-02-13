const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Optional Copilot SDK integration
let copilotClient = null;
let copilotSession = null;

// Initialize Copilot SDK if available
async function initializeCopilot() {
  try {
    const { CopilotClient } = require('@github/copilot-sdk');
    copilotClient = new CopilotClient();
    await copilotClient.start();
    copilotSession = await copilotClient.createSession({
      model: 'gpt-4o',
      streaming: false
    });
    console.log('✓ GitHub Copilot SDK initialized successfully');
    return true;
  } catch (error) {
    console.log('⚠ GitHub Copilot SDK not available, running in manual mode');
    return false;
  }
}

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory data storage (replace with database in production)
let employees = [
  { id: 1, name: 'Alice Johnson', maxHoursPerWeek: 40, preferredDaysOff: ['Sunday'], holidays: [] },
  { id: 2, name: 'Bob Smith', maxHoursPerWeek: 40, preferredDaysOff: ['Saturday', 'Sunday'], holidays: [] },
  { id: 3, name: 'Charlie Brown', maxHoursPerWeek: 30, preferredDaysOff: ['Monday'], holidays: [] },
  { id: 4, name: 'Diana Prince', maxHoursPerWeek: 40, preferredDaysOff: ['Friday'], holidays: [] }
];

let shifts = [];
let absences = [];

// API Routes

// Get all employees
app.get('/api/employees', (req, res) => {
  res.json(employees);
});

// Add employee
app.post('/api/employees', (req, res) => {
  const newEmployee = {
    id: employees.length + 1,
    ...req.body,
    holidays: req.body.holidays || []
  };
  employees.push(newEmployee);
  res.json(newEmployee);
});

// Get all shifts
app.get('/api/shifts', (req, res) => {
  res.json(shifts);
});

// Add shift
app.post('/api/shifts', (req, res) => {
  const newShift = {
    id: shifts.length + 1,
    ...req.body
  };
  shifts.push(newShift);
  res.json(newShift);
});

// Delete shift
app.delete('/api/shifts/:id', (req, res) => {
  const id = parseInt(req.params.id);
  shifts = shifts.filter(s => s.id !== id);
  res.json({ success: true });
});

// Get all absences
app.get('/api/absences', (req, res) => {
  res.json(absences);
});

// Add absence
app.post('/api/absences', (req, res) => {
  const newAbsence = {
    id: absences.length + 1,
    ...req.body
  };
  absences.push(newAbsence);
  res.json(newAbsence);
});

// Manual schedule generation
app.post('/api/schedule/generate', async (req, res) => {
  const { startDate, endDate, shiftsPerDay, hoursPerShift } = req.body;
  
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const generatedShifts = [];
    
    // Manual scheduling algorithm
    let employeeIndex = 0;
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      
      for (let shiftNum = 0; shiftNum < shiftsPerDay; shiftNum++) {
        // Find available employee
        let assigned = false;
        let attempts = 0;
        
        while (!assigned && attempts < employees.length) {
          const employee = employees[employeeIndex % employees.length];
          
          // Check if employee is available
          const isPreferredDayOff = employee.preferredDaysOff.includes(dayName);
          const hasAbsence = absences.some(a => 
            a.employeeId === employee.id && 
            new Date(a.date).toDateString() === date.toDateString()
          );
          
          // Calculate current week hours
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          const weekHours = generatedShifts
            .filter(s => s.employeeId === employee.id && 
                         new Date(s.date) >= weekStart && 
                         new Date(s.date) < date)
            .reduce((sum, s) => sum + s.hours, 0);
          
          if (!isPreferredDayOff && !hasAbsence && (weekHours + hoursPerShift) <= employee.maxHoursPerWeek) {
            generatedShifts.push({
              id: shifts.length + generatedShifts.length + 1,
              employeeId: employee.id,
              employeeName: employee.name,
              date: date.toISOString().split('T')[0],
              hours: hoursPerShift,
              shiftNumber: shiftNum + 1
            });
            assigned = true;
          }
          
          employeeIndex++;
          attempts++;
        }
      }
    }
    
    // Add generated shifts to storage
    shifts.push(...generatedShifts);
    
    res.json({ 
      success: true, 
      shiftsGenerated: generatedShifts.length,
      shifts: generatedShifts 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI-powered schedule generation (if Copilot SDK is available)
app.post('/api/schedule/generate-ai', async (req, res) => {
  if (!copilotSession) {
    return res.status(400).json({ 
      error: 'GitHub Copilot SDK not available. Please use manual scheduling.' 
    });
  }
  
  const { startDate, endDate, shiftsPerDay, hoursPerShift } = req.body;
  
  try {
    const prompt = `Generate an optimal shift schedule with the following parameters:
- Start Date: ${startDate}
- End Date: ${endDate}
- Shifts per day: ${shiftsPerDay}
- Hours per shift: ${hoursPerShift}

Employees:
${employees.map(e => `- ${e.name}: Max ${e.maxHoursPerWeek}h/week, Prefers off: ${e.preferredDaysOff.join(', ')}`).join('\n')}

Absences:
${absences.map(a => {
  const emp = employees.find(e => e.id === a.employeeId);
  return `- ${emp?.name}: ${a.date} (${a.reason})`;
}).join('\n')}

Requirements:
1. Respect work-life balance - don't exceed max hours per week
2. Avoid scheduling on preferred days off when possible
3. Account for registered absences
4. Distribute shifts fairly among employees
5. Ensure adequate coverage

Return a JSON array of shift assignments in this format:
[{"employeeId": number, "employeeName": string, "date": "YYYY-MM-DD", "hours": number, "shiftNumber": number}]`;

    const response = await copilotSession.send({ prompt });
    
    // Parse AI response and generate shifts
    // Note: In production, add proper response parsing
    const generatedShifts = JSON.parse(response.content);
    
    // Add IDs to shifts
    generatedShifts.forEach((shift, idx) => {
      shift.id = shifts.length + idx + 1;
    });
    
    shifts.push(...generatedShifts);
    
    res.json({ 
      success: true, 
      shiftsGenerated: generatedShifts.length,
      shifts: generatedShifts,
      aiGenerated: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check if Copilot is available
app.get('/api/copilot/status', (req, res) => {
  res.json({ available: copilotClient !== null });
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
async function startServer() {
  await initializeCopilot();
  
  app.listen(PORT, () => {
    console.log(`\n🚀 Shift Scheduler is running on http://localhost:${PORT}`);
    console.log(`📊 Manual scheduling: Available`);
    console.log(`🤖 AI scheduling: ${copilotClient ? 'Available' : 'Not available'}\n`);
  });
}

startServer();
