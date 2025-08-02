// Configuração da API
const API_BASE_URL = "/api"
const SUPABASE_URL = "YOUR_SUPABASE_URL"
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY"

// Estado da aplicação
let currentUser = null
let currentUserType = null

// Elementos DOM
const loginForm = document.getElementById("loginForm")
const registerForm = document.getElementById("registerForm")
const dashboard = document.getElementById("dashboard")
const loading = document.getElementById("loading")

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  initializeApp()
  setupEventListeners()
})

function initializeApp() {
  // Verificar se há usuário logado
  // A sessão é gerenciada por cookies do Supabase.
  // Tentamos carregar o perfil, se falhar, o usuário é deslogado.
  loadUserProfile().catch(() => {
    showLogin()
  })
}

function setupEventListeners() {
  // Login/Register forms
  document.getElementById("showRegister").addEventListener("click", showRegister)
  document.getElementById("showLogin").addEventListener("click", showLogin)
  document.getElementById("loginFormElement").addEventListener("submit", handleLogin)
  document.getElementById("registerFormElement").addEventListener("submit", handleRegister)
  document.getElementById("googleLogin").addEventListener("click", handleGoogleLogin)
  document.getElementById("logoutBtn").addEventListener("click", handleLogout)

  // User type change
  document.getElementById("registerUserType").addEventListener("change", function () {
    const doctorFields = document.getElementById("doctorFields")
    if (this.value === "doctor") {
      doctorFields.style.display = "block"
    } else {
      doctorFields.style.display = "none"
    }
  })

  // Máscara para o telefone
  document.getElementById("registerPhone").addEventListener("input", applyPhoneMask)

  // Tabs
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", function () {
      switchTab(this.dataset.tab)
    })
  })

  // Schedule form
  document.getElementById("scheduleForm").addEventListener("submit", handleScheduleAppointment)
}

// Authentication functions
async function handleLogin(e) {
  e.preventDefault()
  showLoading(true)

  const email = document.getElementById("loginEmail").value
  const password = document.getElementById("loginPassword").value

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (response.ok) {
      await loadUserProfile()
      showSuccess("Login realizado com sucesso!")
    } else {
      showError(data.error || "Erro no login")
    }
  } catch (error) {
// Em public/app.js
function applyPhoneMask(e) {
  let value = e.target.value.replace(/\D/g, "")
  value = value.replace(/^(\d{2})(\d)/g, "($1) ")
  value = value.replace(/(\d{5})(\d)/, "-")
  value = value.replace(/(\d{4})-(\d)(\d{4})/, "-")
  e.target.value = value.substring(0, 15) // Limita o tamanho
}
    console.error("Falha na requisição de login:", error)
    showError("Erro de conexão. Verifique o console do navegador e o terminal do servidor para mais detalhes.")
  } finally {
    showLoading(false)
  }
}

async function handleRegister(e) {
  e.preventDefault()
  showLoading(true)

  const formData = {
    email: document.getElementById("registerEmail").value,
    password: document.getElementById("registerPassword").value,
    full_name: document.getElementById("registerName").value,
    phone: document.getElementById("registerPhone").value,
    user_type: document.getElementById("registerUserType").value,
    specialty: document.getElementById("registerSpecialty").value,
    crm: document.getElementById("registerCrm").value,
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    })

    const data = await response.json()

    if (response.ok) {
      showSuccess("Cadastro realizado com sucesso! Faça login para continuar.")
      showLogin()
    } else {
      if (data.errors) {
        showError(data.errors.map((err) => err.message).join(", "))
      } else {
        showError(data.error || "Erro no cadastro")
      }
    }
  } catch (error) {
    showError("Erro de conexão")
  } finally {
    showLoading(false)
  }
}

function handleGoogleLogin() {
  // Implementar OAuth com Google via Supabase
  showError("Login com Google será implementado em breve")
}

function handleLogout() {
  fetch(`${API_BASE_URL}/auth/logout`, { method: "POST" })
    .then(() => {
      currentUser = null
      currentUserType = null
      showLogin()
      showSuccess("Logout realizado com sucesso!")
    })
    .catch(() => showError("Erro ao fazer logout."))
}

async function loadUserProfile() {
  try {
    showLoading(true)
    const response = await fetch(`${API_BASE_URL}/me`)
    if (!response.ok) {
      throw new Error("Sessão inválida ou expirada.")
    }
    const data = await response.json()
    currentUser = data.user
    currentUserType = currentUser.user_type

    showDashboard()
    await loadDashboardData()
  } catch (error) {
    showError(error.message || "Erro ao carregar perfil do usuário")
    handleLogout()
  }
}

// Dashboard functions
function showDashboard() {
  loginForm.style.display = "none"
  registerForm.style.display = "none"
  dashboard.style.display = "block"

  document.getElementById("userName").textContent = currentUser.full_name

  // Configurar tabs baseado no tipo de usuário
  const doctorsTab = document.getElementById("doctorsTab")
  const scheduleTab = document.getElementById("scheduleTab")

  if (currentUserType === "patient") {
    doctorsTab.style.display = "block"
    scheduleTab.style.display = "block"
  } else if (currentUserType === "doctor") {
    doctorsTab.style.display = "none"
    scheduleTab.style.display = "none"
  } else if (currentUserType === "admin") {
    doctorsTab.style.display = "block"
    scheduleTab.style.display = "none"
  }
}

async function loadDashboardData() {
  await loadAppointments()
  if (currentUserType === "patient" || currentUserType === "admin") {
    await loadDoctors()
  }
}

async function loadAppointments() {
  try {
    showLoading(true)
    const response = await fetch(`${API_BASE_URL}/appointments`)
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Falha ao carregar consultas")
    }
    const data = await response.json()
    // A API retorna um objeto com a chave 'appointments'
    // O nome do paciente/médico está em `patients.profiles.full_name` ou `doctors.profiles.full_name`
    displayAppointments(data.appointments || [])
  } catch (error) {
    console.error(error)
    showError(error.message || "Erro ao carregar consultas")
  } finally {
    showLoading(false)
  }
}

function displayAppointments(appointments) {
  const appointmentsList = document.getElementById("appointmentsList")

  if (appointments.length === 0) {
    appointmentsList.innerHTML = "<p>Nenhuma consulta encontrada.</p>"
    return
  }

  appointmentsList.innerHTML = appointments
    .map((appointment) => {
      const date = new Date(appointment.appointment_date)
      const formattedDate = date.toLocaleDateString("pt-BR")
      const formattedTime = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })

      return `
            <div class="appointment-card">
                <div class="appointment-header">
                    <div class="appointment-date">${formattedDate} às ${formattedTime}</div>
                    <div class="appointment-status status-${appointment.status}">
                        ${getStatusText(appointment.status)}
                    </div>
                </div>
                <div class="appointment-info">
                    <div><strong>Médico:</strong> ${appointment.doctors.profiles.full_name}</div>
                    <div><strong>Especialidade:</strong> ${appointment.doctors.specialty}</div>
                    ${currentUserType !== "patient" ? `<div><strong>Paciente:</strong> ${appointment.patient.profiles.full_name}</div>` : ""}
                    ${appointment.notes ? `<div><strong>Observações:</strong> ${appointment.notes}</div>` : ""}
                </div>
                ${
                  appointment.status === "scheduled"
                    ? `
                    <div class="appointment-actions">
                        <button class="btn-reschedule" onclick="rescheduleAppointment('${appointment.id}')">
                            Reagendar
                        </button>
                        <button class="btn-cancel" onclick="cancelAppointment('${appointment.id}')">
                            Cancelar
                        </button>
                    </div>
                `
                    : ""
                }
            </div>
        `
    })
    .join("")
}

async function loadDoctors() {
  try {
    const response = await fetch(`${API_BASE_URL}/doctors`)
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Falha ao carregar médicos")
    }
    const data = await response.json()
    // A API retorna um objeto com a chave 'doctors'
    displayDoctors(data.doctors || [])
    populateDoctorSelect(data.doctors || [])
  } catch (error) {
    console.error(error)
    showError(error.message || "Erro ao carregar médicos")
  }
}

function displayDoctors(doctors) {
  const doctorsList = document.getElementById("doctorsList")

  doctorsList.innerHTML = doctors
    .map(
      (doctor) => `
        <div class="doctor-card">
            <div class="doctor-info">
                <h3>${doctor.profiles.full_name}</h3>
                <div class="doctor-specialty">${doctor.specialty}</div>
                <div class="doctor-crm">CRM: ${doctor.crm}</div>
                <div>Email: ${doctor.profiles.email}</div>
                <div>Telefone: ${doctor.profiles.phone}</div>
            </div>
        </div>
    `,
    )
    .join("")
}

function populateDoctorSelect(doctors) {
  const select = document.getElementById("scheduleDoctor")
  select.innerHTML =
    '<option value="">Selecione um médico...</option>' +
    doctors
      .map((doctor) => `<option value="${doctor.id}">${doctor.profiles.full_name} - ${doctor.specialty}</option>`)
      .join("")
}

async function handleScheduleAppointment(e) {
  e.preventDefault()
  showLoading(true)

  const doctorId = document.getElementById("scheduleDoctor").value
  const date = document.getElementById("scheduleDate").value
  const time = document.getElementById("scheduleTime").value
  const notes = document.getElementById("scheduleNotes").value

  const appointmentDate = new Date(`${date}T${time}:00`)

  try {
    const response = await fetch(`${API_BASE_URL}/appointments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        doctor_id: doctorId,
        appointment_date: appointmentDate.toISOString(),
        notes: notes,
      }),
    })

    const data = await response.json()

    if (response.ok) {
      showSuccess("Consulta agendada com sucesso!")
      document.getElementById("scheduleForm").reset()
      await loadAppointments()
      switchTab("appointments")
    } else {
      showError(data.error || "Erro ao agendar consulta")
    }
  } catch (error) {
    showError("Erro de conexão")
  } finally {
    showLoading(false)
  }
}

async function cancelAppointment(appointmentId) {
  if (!confirm("Tem certeza que deseja cancelar esta consulta?")) {
    return
  }

  try {
    showLoading(true)

    const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "cancelled" }),
    })

    if (response.ok) {
      showSuccess("Consulta cancelada com sucesso!")
      await loadAppointments()
    } else {
      showError("Erro ao cancelar consulta")
    }
  } catch (error) {
    showError("Erro de conexão")
  } finally {
    showLoading(false)
  }
}

function rescheduleAppointment(appointmentId) {
  showError("Funcionalidade de reagendamento será implementada em breve")
}

// Utility functions
function showLogin() {
  loginForm.style.display = "block"
  registerForm.style.display = "none"
  dashboard.style.display = "none"
}

function showRegister() {
  loginForm.style.display = "none"
  registerForm.style.display = "block"
  dashboard.style.display = "none"
}

function switchTab(tabName) {
  // Remove active class from all tabs and contents
  document.querySelectorAll(".tab-button").forEach((btn) => btn.classList.remove("active"))
  document.querySelectorAll(".tab-content").forEach((content) => content.classList.remove("active"))

  // Add active class to selected tab and content
  document.querySelector(`[data-tab="${tabName}"]`).classList.add("active")
  document.getElementById(`${tabName}Tab${tabName === "appointments" ? "" : "Content"}`).classList.add("active")
}

function showLoading(show) {
  loading.style.display = show ? "flex" : "none"
}

function showError(message) {
  const errorDiv = document.getElementById("errorMessage")
  errorDiv.textContent = message
  errorDiv.style.display = "block"
  setTimeout(() => {
    errorDiv.style.display = "none"
  }, 5000)
}

function showSuccess(message) {
  const successDiv = document.getElementById("successMessage")
  successDiv.textContent = message
  successDiv.style.display = "block"
  setTimeout(() => {
    successDiv.style.display = "none"
  }, 5000)
}

function getStatusText(status) {
  const statusMap = {
    scheduled: "Agendada",
    completed: "Concluída",
    cancelled: "Cancelada",
    rescheduled: "Reagendada",
  }
  return statusMap[status] || status
}

function applyPhoneMask(e) {
  let value = e.target.value.replace(/\D/g, "")
  value = value.replace(/^(\d{2})(\d)/g, "($1) $2")
  value = value.replace(/(\d{5})(\d)/, "$1-$2")
  value = value.replace(/(\d{4})-(\d)(\d{4})/, "$1$2-$3")
  e.target.value = value.substring(0, 15) // Limita o tamanho
}

// Set minimum date for appointment scheduling
document.addEventListener("DOMContentLoaded", () => {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const dateInput = document.getElementById("scheduleDate")
  if (dateInput) {
    dateInput.min = tomorrow.toISOString().split("T")[0]
  }
})
