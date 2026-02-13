// Global state
let employees = [];
let shifts = [];
let absences = [];
let copilotAvailable = false;

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    await checkCopilotStatus();
    await loadEmployees();
    await loadShifts();
    await loadAbsences();
    
    // Set default dates for generation
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    document.getElementById('gen-start-date').valueAsDate = today;
    document.getElementById('gen-end-date').valueAsDate = nextWeek;
});

// Check if Copilot SDK is available
async function checkCopilotStatus() {
    try {
        const response = await fetch('/api/copilot/status');
        const data = await response.json();
        copilotAvailable = data.available;
        
        const statusBadge = document.getElementById('copilot-status');
        const statusText = document.getElementById('status-text');
        const aiButton = document.getElementById('ai-generate-btn');
        
        if (copilotAvailable) {
            statusBadge.className = 'status-badge available';
            statusText.textContent = '🤖 AI Scheduling Available';
            aiButton.disabled = false;
        } else {
            statusBadge.className = 'status-badge unavailable';
            statusText.textContent = '📋 Manual Mode Only';
            aiButton.disabled = true;
            aiButton.title = 'GitHub Copilot SDK not configured';
        }
    } catch (error) {
        console.error('Error checking Copilot status:', error);
    }
}

// Tab management
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(`${tabName}-tab`).classList.add('active');
    event.target.classList.add('active');
    
    // Refresh data when switching tabs
    if (tabName === 'schedule') loadShifts();
    if (tabName === 'employees') loadEmployees();
    if (tabName === 'absences') loadAbsences();
}

// Load employees
async function loadEmployees() {
    try {
        const response = await fetch('/api/employees');
        employees = await response.json();
        displayEmployees();
        updateEmployeeSelects();
    } catch (error) {
        console.error('Error loading employees:', error);
    }
}

// Display employees
function displayEmployees() {
    const container = document.getElementById('employees-list');
    
    if (employees.length === 0) {
        container.innerHTML = '<div class="empty-state">No employees added yet. Click "Add Employee" to get started.</div>';
        return;
    }
    
    container.innerHTML = employees.map(emp => `
        <div class="card">
            <h3>${emp.name}</h3>
            <div class="card-info">📊 Max Hours/Week: ${emp.maxHoursPerWeek}</div>
            <div class="card-info">🏖️ Preferred Days Off:</div>
            <div>
                ${emp.preferredDaysOff.map(day => 
                    `<span class="badge badge-primary">${day}</span>`
                ).join('')}
            </div>
        </div>
    `).join('');
}

// Update employee select dropdowns
function updateEmployeeSelects() {
    const filterSelect = document.getElementById('filter-employee');
    const absenceSelect = document.getElementById('absence-employee');
    
    const options = employees.map(emp => 
        `<option value="${emp.id}">${emp.name}</option>`
    ).join('');
    
    filterSelect.innerHTML = '<option value="">All Employees</option>' + options;
    absenceSelect.innerHTML = '<option value="">Select Employee</option>' + options;
}

// Show/hide add employee form
function showAddEmployeeForm() {
    document.getElementById('add-employee-form').style.display = 'block';
}

function hideAddEmployeeForm() {
    document.getElementById('add-employee-form').style.display = 'none';
    document.querySelector('#add-employee-form form').reset();
}

// Add employee
async function addEmployee(event) {
    event.preventDefault();
    
    const name = document.getElementById('emp-name').value;
    const maxHoursPerWeek = parseInt(document.getElementById('emp-max-hours').value);
    const checkboxes = document.querySelectorAll('.checkbox-group input:checked');
    const preferredDaysOff = Array.from(checkboxes).map(cb => cb.value);
    
    try {
        const response = await fetch('/api/employees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, maxHoursPerWeek, preferredDaysOff })
        });
        
        if (response.ok) {
            await loadEmployees();
            hideAddEmployeeForm();
        }
    } catch (error) {
        console.error('Error adding employee:', error);
        alert('Failed to add employee');
    }
}

// Load shifts
async function loadShifts() {
    try {
        const response = await fetch('/api/shifts');
        shifts = await response.json();
        displayShifts();
    } catch (error) {
        console.error('Error loading shifts:', error);
    }
}

// Display shifts
function displayShifts() {
    const container = document.getElementById('schedule-list');
    const filterDate = document.getElementById('filter-date').value;
    const filterEmployee = document.getElementById('filter-employee').value;
    
    let filteredShifts = shifts;
    
    if (filterDate) {
        filteredShifts = filteredShifts.filter(s => s.date === filterDate);
    }
    
    if (filterEmployee) {
        filteredShifts = filteredShifts.filter(s => s.employeeId === parseInt(filterEmployee));
    }
    
    if (filteredShifts.length === 0) {
        container.innerHTML = '<div class="empty-state">No shifts scheduled. Use the "Generate" tab to create a schedule.</div>';
        return;
    }
    
    // Sort by date
    filteredShifts.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    container.innerHTML = filteredShifts.map(shift => `
        <div class="card">
            <h3>${shift.employeeName}</h3>
            <div class="card-info">📅 ${formatDate(shift.date)}</div>
            <div class="card-info">⏰ ${shift.hours} hours</div>
            <div class="card-info">🔢 Shift #${shift.shiftNumber}</div>
            <div class="card-actions">
                <button class="btn btn-danger" onclick="deleteShift(${shift.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

// Delete shift
async function deleteShift(id) {
    if (!confirm('Are you sure you want to delete this shift?')) return;
    
    try {
        const response = await fetch(`/api/shifts/${id}`, { method: 'DELETE' });
        if (response.ok) {
            await loadShifts();
        }
    } catch (error) {
        console.error('Error deleting shift:', error);
        alert('Failed to delete shift');
    }
}

// Load absences
async function loadAbsences() {
    try {
        const response = await fetch('/api/absences');
        absences = await response.json();
        displayAbsences();
    } catch (error) {
        console.error('Error loading absences:', error);
    }
}

// Display absences
function displayAbsences() {
    const container = document.getElementById('absences-list');
    
    if (absences.length === 0) {
        container.innerHTML = '<div class="empty-state">No absences registered.</div>';
        return;
    }
    
    container.innerHTML = absences.map(absence => {
        const employee = employees.find(e => e.id === absence.employeeId);
        return `
            <div class="card">
                <h3>${employee ? employee.name : 'Unknown'}</h3>
                <div class="card-info">📅 ${formatDate(absence.date)}</div>
                <div class="card-info">
                    <span class="badge badge-warning">${absence.reason}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Show/hide add absence form
function showAddAbsenceForm() {
    document.getElementById('add-absence-form').style.display = 'block';
}

function hideAddAbsenceForm() {
    document.getElementById('add-absence-form').style.display = 'none';
    document.querySelector('#add-absence-form form').reset();
}

// Add absence
async function addAbsence(event) {
    event.preventDefault();
    
    const employeeId = parseInt(document.getElementById('absence-employee').value);
    const date = document.getElementById('absence-date').value;
    const reason = document.getElementById('absence-reason').value;
    
    try {
        const response = await fetch('/api/absences', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employeeId, date, reason })
        });
        
        if (response.ok) {
            await loadAbsences();
            hideAddAbsenceForm();
        }
    } catch (error) {
        console.error('Error adding absence:', error);
        alert('Failed to add absence');
    }
}

// Generate schedule
async function generateSchedule(event) {
    event.preventDefault();
    
    const mode = event.submitter.value;
    const startDate = document.getElementById('gen-start-date').value;
    const endDate = document.getElementById('gen-end-date').value;
    const shiftsPerDay = parseInt(document.getElementById('gen-shifts-per-day').value);
    const hoursPerShift = parseInt(document.getElementById('gen-hours-per-shift').value);
    
    if (!startDate || !endDate) {
        alert('Please select start and end dates');
        return;
    }
    
    if (employees.length === 0) {
        alert('Please add employees before generating a schedule');
        return;
    }
    
    const resultDiv = document.getElementById('generation-result');
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = '<div class="loading">⏳ Generating schedule...</div>';
    
    try {
        const endpoint = mode === 'ai' ? '/api/schedule/generate-ai' : '/api/schedule/generate';
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ startDate, endDate, shiftsPerDay, hoursPerShift })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            resultDiv.innerHTML = `
                <h3>✅ Schedule Generated Successfully!</h3>
                <p><strong>${data.shiftsGenerated}</strong> shifts created</p>
                <p>Mode: ${data.aiGenerated ? '🤖 AI-Powered' : '📋 Manual'}</p>
                <button class="btn btn-primary" onclick="showTab('schedule'); loadShifts();">
                    View Schedule
                </button>
            `;
        } else {
            resultDiv.innerHTML = `
                <div style="background: #f8d7da; border-color: #f5c6cb; color: #721c24;">
                    <h3>❌ Generation Failed</h3>
                    <p>${data.error}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error generating schedule:', error);
        resultDiv.innerHTML = `
            <div style="background: #f8d7da; border-color: #f5c6cb; color: #721c24;">
                <h3>❌ Error</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Utility function to format dates
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}
