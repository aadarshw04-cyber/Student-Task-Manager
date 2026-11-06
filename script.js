const $ = id => document.getElementById(id);
let barChart = null;
let pieChart = null;

function updateAnalyticsCharts() {
  const completed = tasks.filter(task => task.done).length;
  const pending = tasks.length - completed;

  const subjects = {};
  tasks.forEach(task => {
    subjects[task.subject] = (subjects[task.subject] || 0) + 1;
  });

  // Bar Graph: Tasks by subject
  const barCanvas = document.getElementById("barGraph");

  if (barCanvas) {
    const barData = {
      labels: Object.keys(subjects),
      datasets: [{
        label: "Number of Tasks",
        data: Object.values(subjects),
        backgroundColor: "#6366f1"
      }]
    };

    if (barChart) {
      barChart.data = barData;
      barChart.update();
    } else {
      barChart = new Chart(barCanvas, {
        type: "bar",
        data: barData,
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              ticks: { precision: 0 }
            }
          }
        }
      });
    }
  }

  // Pie Graph: Completed vs Pending
  const pieCanvas = document.getElementById("pieGraph");

  if (pieCanvas) {
    const pieData = {
      labels: ["Completed", "Pending"],
      datasets: [{
        data: [completed, pending],
        backgroundColor: ["#22c55e", "#f59e0b"]
      }]
    };

    if (pieChart) {
      pieChart.data = pieData;
      pieChart.update();
    } else {
      pieChart = new Chart(pieCanvas, {
        type: "pie",
        data: pieData,
        options: {
          responsive: true
        }
      });
    }
  }
}
let tasks = [];
let seconds = 25 * 60;
let timerInterval = null;

try {
  tasks = JSON.parse(localStorage.getItem("studymate-tasks")) || [];
} catch {
  tasks = [];
}

function saveTasks() {
  localStorage.setItem("studymate-tasks", JSON.stringify(tasks));
}

function renderTasks() {
  const query = $("search").value.toLowerCase();
  const filter = $("filter").value;
  const list = $("taskList");
  list.innerHTML = "";

  const filtered = tasks.filter(task => {
    const matchesText =
      task.title.toLowerCase().includes(query) ||
      task.subject.toLowerCase().includes(query);

    const status = task.done ? "Completed" : "Pending";
    return matchesText && (filter === "All" || filter === status);
  });

  if (!filtered.length) {
    list.textContent = "No tasks found. Add your first task above!";
  }

  filtered.forEach(task => {
    const item = document.createElement("div");
    item.className = "task" + (task.done ? " done" : "");

    const info = document.createElement("div");
    info.className = "task-info";

    const title = document.createElement("h3");
    title.textContent = task.title;

    const details = document.createElement("p");
    details.textContent = `${task.subject} • Due: ${task.dueDate}`;

    const priority = document.createElement("p");
    priority.className = "priority-" + task.priority;
    priority.textContent = task.priority + " Priority";

    info.append(title, details, priority);

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const toggle = document.createElement("button");
    toggle.textContent = task.done ? "Undo" : "Complete";
    toggle.onclick = () => {
      task.done = !task.done;
      saveTasks();
      renderTasks();
    };

    const remove = document.createElement("button");
    remove.textContent = "Delete";
    remove.style.background = "#d94b55";
    remove.onclick = () => {
      tasks = tasks.filter(t => t.id !== task.id);
      saveTasks();
      renderTasks();
    };

    actions.append(toggle, remove);
    item.append(info, actions);
    list.appendChild(item);
  });

  const completed = tasks.filter(t => t.done).length;
  const pending = tasks.length - completed;

  $("total").textContent = tasks.length;
  $("pending").textContent = pending;
  $("completed").textContent = completed;

  const rate = tasks.length ? Math.round(completed / tasks.length * 100) : 0;
  $("rate").textContent = rate + "%";
  $("progress").value = rate;

  const subjects = {};
  tasks.forEach(t => {
    subjects[t.subject] = (subjects[t.subject] || 0) + 1;
  });

  $("subjectStats").innerHTML = "";
  Object.entries(subjects).forEach(([subject, count]) => {
    const line = document.createElement("p");
    line.textContent = `${subject}: ${count} task(s)`;
    $("subjectStats").appendChild(line);
  });
  updateAnalyticsCharts();
}

$("taskForm").addEventListener("submit", event => {
  event.preventDefault();

  tasks.unshift({
    id: Date.now(),
    title: $("taskTitle").value.trim(),
    subject: $("subject").value.trim(),
    dueDate: $("dueDate").value,
    priority: $("priority").value,
    done: false
  });

  saveTasks();
  $("taskForm").reset();
  renderTasks();
});

$("search").addEventListener("input", renderTasks);
$("filter").addEventListener("change", renderTasks);

document.querySelectorAll("[data-page]").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".page").forEach(page => {
      page.classList.add("hidden");
    });

    $(button.dataset.page).classList.remove("hidden");

    document.querySelectorAll(".nav-btn").forEach(btn => {
      btn.classList.remove("active");
    });
    button.classList.add("active");
  });
});

$("themeBtn").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem(
    "studymate-theme",
    document.body.classList.contains("dark") ? "dark" : "light"
  );
});

if (localStorage.getItem("studymate-theme") === "dark") {
  document.body.classList.add("dark");
}

$("saveProfile").addEventListener("click", () => {
  const profile = {
    name: $("profileName").value.trim(),
    college: $("college").value.trim()
  };

  localStorage.setItem("studymate-profile", JSON.stringify(profile));
  $("profileMessage").textContent = "Profile saved successfully!";
});

try {
  const profile = JSON.parse(localStorage.getItem("studymate-profile")) || {};
  $("profileName").value = profile.name || "";
  $("college").value = profile.college || "";
} catch {}

function showTimer() {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  $("timer").textContent =
    String(mins).padStart(2, "0") + ":" +
    String(secs).padStart(2, "0");
}

$("startTimer").addEventListener("click", () => {
  if (timerInterval !== null) return;

  timerInterval = setInterval(() => {
    if (seconds > 0) {
      seconds--;
      showTimer();
    } else {
      clearInterval(timerInterval);
      timerInterval = null;
      alert("Focus session complete! Take a short break.");
    }
  }, 1000);
});

$("pauseTimer").addEventListener("click", () => {
  clearInterval(timerInterval);
  timerInterval = null;
});

$("resetTimer").addEventListener("click", () => {
  clearInterval(timerInterval);
  timerInterval = null;
  seconds = 25 * 60;
  showTimer();
});

renderTasks();
showTimer();