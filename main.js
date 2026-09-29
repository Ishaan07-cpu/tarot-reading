// ============================================================
//  EK RAAZ KI BAAT BATAU? — Main JavaScript
// ============================================================

// ── Starfield Canvas ──────────────────────────────────────────
(function initStars() {
  const canvas = document.getElementById('starCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let stars = [];
  let W, H;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function createStars(count = 200) {
    stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.4 + 0.3,
        alpha: Math.random(),
        speed: Math.random() * 0.004 + 0.001,
        phase: Math.random() * Math.PI * 2,
        color: Math.random() > 0.85 ? '#d4a853' : '#f8f4ff'
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const now = Date.now() / 1000;
    stars.forEach(s => {
      const a = 0.3 + 0.7 * Math.abs(Math.sin(now * s.speed * 3 + s.phase));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = s.color === '#d4a853'
        ? `rgba(212,168,83,${a})`
        : `rgba(248,244,255,${a * 0.6})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  resize();
  createStars();
  draw();
  window.addEventListener('resize', () => { resize(); createStars(); });
})();


// ── Navbar Scroll Behaviour ───────────────────────────────────
(function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  // Active link highlight
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navLinks.forEach(l => {
          l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id);
        });
      }
    });
  }, { threshold: 0.4 });
  sections.forEach(s => observer.observe(s));
})();


// ── Hamburger Menu ────────────────────────────────────────────
(function initHamburger() {
  const btn  = document.getElementById('hamburger');
  const menu = document.getElementById('navLinks');
  if (!btn || !menu) return;
  btn.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  menu.querySelectorAll('.nav-link').forEach(l => {
    l.addEventListener('click', () => {
      menu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
})();


// ── Scroll Reveal ─────────────────────────────────────────────
(function initReveal() {
  const els = document.querySelectorAll(
    '.service-card, .testimonial-card, .step, .pillar, .about-visual, .about-content, .appt-container, .auth-container'
  );
  els.forEach(el => el.classList.add('reveal'));
  const obs = new IntersectionObserver(entries => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        const delay = e.target.dataset.delay || 0;
        setTimeout(() => e.target.classList.add('visible'), +delay);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(el => obs.observe(el));
})();


// ── Mouse Parallax on Hero ────────────────────────────────────
(function initParallax() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const bg = hero.querySelector('.hero-bg-image');
  hero.addEventListener('mousemove', e => {
    const { clientX, clientY } = e;
    const xPct = (clientX / window.innerWidth  - 0.5) * 12;
    const yPct = (clientY / window.innerHeight - 0.5) * 8;
    bg.style.transform = `scale(1.08) translate(${xPct}px, ${yPct}px)`;
  });
  hero.addEventListener('mouseleave', () => {
    bg.style.transform = '';
  });
})();


// ── Auth Forms (login.html / signup.html) ─────────────────────
(function initAuthForms() {
  const loginForm  = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');

  // Show already-logged-in notice if applicable
  const existingUser = JSON.parse(localStorage.getItem('tarot_user') || 'null');
  if (existingUser) {
    const activeForm = loginForm || signupForm;
    if (activeForm && !document.getElementById('loggedInNotice')) {
      const notice = document.createElement('div');
      notice.id = 'loggedInNotice';
      notice.style.cssText = 'background:rgba(212,168,83,0.12);border:1px solid rgba(212,168,83,0.35);border-radius:8px;padding:0.75rem 1rem;margin-bottom:1.5rem;text-align:center;font-size:0.85rem;color:var(--gold-light);';
      notice.innerHTML = `Signed in as <strong>${existingUser.name}</strong> · <a href="appointment.html" style="color:#fff;text-decoration:underline;font-weight:500;">Go to Portal ✦</a> or <button id="switchAccountBtn" type="button" style="background:none;border:none;color:#fca5a5;text-decoration:underline;cursor:pointer;font-size:0.85rem;padding:0;margin-left:0.4rem;">Logout</button>`;
      activeForm.parentNode.insertBefore(notice, activeForm);
      document.getElementById('switchAccountBtn')?.addEventListener('click', () => {
        localStorage.removeItem('tarot_token');
        localStorage.removeItem('tarot_user');
        notice.remove();
      });
    }
  }

  // ── LOGIN ─────────────────────────────────────────────────────
  if (loginForm) {
    loginForm.addEventListener('submit', async e => {
      e.preventDefault();
      const email    = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      if (!email || !password) return showFormError(loginForm, 'Please fill in all fields.');

      const submitBtn = document.getElementById('loginSubmitBtn');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Consulting the stars...'; }

      try {
        const res  = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
        const data = await res.json();

        if (res.ok && data.success) {
          localStorage.setItem('tarot_token', data.token);
          localStorage.setItem('tarot_user', JSON.stringify(data.user));
          showFormSuccess(loginForm, `Welcome back, ${data.user.name}! Redirecting…`);
          setTimeout(() => { window.location.href = 'appointment.html'; }, 1300);
        } else if (data.needsVerification) {
          // Redirect to OTP verification page
          sessionStorage.setItem('pending_otp_email', data.email || email);
          showFormError(loginForm, data.message || 'Email not verified. Redirecting to verification…');
          setTimeout(() => { window.location.href = 'verify.html'; }, 1300);
        } else {
          showFormError(loginForm, data.message || 'Invalid email or password.');
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Enter the Portal'; }
        }
      } catch (err) {
        showFormError(loginForm, 'Could not reach server. Please ensure the backend is running.');
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Enter the Portal'; }
      }
    });
  }

  // ── SIGNUP ────────────────────────────────────────────────────
  if (signupForm) {
    signupForm.addEventListener('submit', async e => {
      e.preventDefault();
      const name     = document.getElementById('signupName').value.trim();
      const email    = document.getElementById('signupEmail').value.trim();
      const password = document.getElementById('signupPassword').value;
      const confirm  = document.getElementById('signupConfirm').value;

      if (!name || !email || !password || !confirm) return showFormError(signupForm, 'Please fill in all fields.');
      if (password !== confirm) return showFormError(signupForm, 'Passwords do not match.');
      if (password.length < 6) return showFormError(signupForm, 'Password must be at least 6 characters.');

      const submitBtn = document.getElementById('signupSubmitBtn');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Aligning the cosmos...'; }

      try {
        const res  = await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) });
        const data = await res.json();

        if (res.ok && data.success) {
          // Save email for OTP page and redirect
          sessionStorage.setItem('pending_otp_email', data.email || email);
          showFormSuccess(signupForm, `${data.message || 'Account created!'} Redirecting…`);
          setTimeout(() => { window.location.href = 'verify.html'; }, 1300);
        } else {
          showFormError(signupForm, data.message || 'Signup failed. Please try again.');
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Create My Account'; }
        }
      } catch (err) {
        showFormError(signupForm, 'Could not reach server. Please ensure the backend is running.');
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Create My Account'; }
      }
    });
  }
})();

function showFormError(form, msg) {
  clearFormMsg(form);
  const div = document.createElement('div');
  div.className = 'form-msg error';
  div.textContent = msg;
  form.prepend(div);
  setTimeout(() => div.remove(), 4000);
}
function showFormSuccess(form, msg) {
  clearFormMsg(form);
  const div = document.createElement('div');
  div.className = 'form-msg success';
  div.textContent = msg;
  form.prepend(div);
}
function clearFormMsg(form) {
  form.querySelectorAll('.form-msg').forEach(el => el.remove());
}



// ── Appointment Form & My Bookings ────────────────────────────
(function initApptSystem() {
  const form = document.getElementById('appointmentForm');
  const tabBook = document.getElementById('tabBook');
  const tabMyBookings = document.getElementById('tabMyBookings');
  const myBookingsContainer = document.getElementById('myBookingsContainer');
  const myBookingsList = document.getElementById('myBookingsList');
  const viewBookingsBtn = document.getElementById('viewBookingsBtn');
  const successMsg = document.getElementById('successMsg');

  // Pre-fill if logged in
  const user = JSON.parse(localStorage.getItem('tarot_user') || sessionStorage.getItem('tarot_user') || 'null');
  if (user) {
    const nameEl  = document.getElementById('apptName');
    const emailEl = document.getElementById('apptEmail');
    if (nameEl && !nameEl.value)  nameEl.value  = user.name;
    if (emailEl && !emailEl.value) emailEl.value = user.email;
  }

  // Set min date to today
  const dateEl = document.getElementById('apptDate');
  if (dateEl) {
    const today = new Date().toISOString().split('T')[0];
    dateEl.setAttribute('min', today);
  }

  // Tab switching
  function showTab(tabName) {
    if (tabName === 'book') {
      if (tabBook) tabBook.classList.add('active');
      if (tabMyBookings) tabMyBookings.classList.remove('active');
      if (form) form.style.display = 'block';
      if (myBookingsContainer) myBookingsContainer.style.display = 'none';
      if (successMsg) successMsg.style.display = 'none';
    } else {
      if (tabBook) tabBook.classList.remove('active');
      if (tabMyBookings) tabMyBookings.classList.add('active');
      if (form) form.style.display = 'none';
      if (successMsg) successMsg.style.display = 'none';
      if (myBookingsContainer) myBookingsContainer.style.display = 'block';
      loadMyBookings();
    }
  }

  if (tabBook) tabBook.addEventListener('click', () => showTab('book'));
  if (tabMyBookings) tabMyBookings.addEventListener('click', () => showTab('myBookings'));
  if (viewBookingsBtn) viewBookingsBtn.addEventListener('click', () => showTab('myBookings'));

  // Load My Bookings from MongoDB
  async function loadMyBookings() {
    if (!myBookingsList) return;
    const token = localStorage.getItem('tarot_token');

    if (!token) {
      myBookingsList.innerHTML = `
        <div class="empty-bookings">
          <p style="margin-bottom:1.2rem;">You are not logged in. Please log in to view your sacred bookings.</p>
          <a href="login.html" class="btn-primary" style="display:inline-block; padding:0.6rem 1.4rem;">Log In to Portal ✦</a>
        </div>
      `;
      return;
    }

    myBookingsList.innerHTML = `
      <div class="empty-bookings">
        <p>✦ Consulting the stars & database records...</p>
      </div>
    `;

    try {
      const res = await fetch('/api/appointments/my', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        myBookingsList.innerHTML = `
          <div class="empty-bookings">
            <p style="color:#fca5a5;">${data.message || 'Could not load bookings.'}</p>
          </div>
        `;
        return;
      }

      if (!data.appointments || data.appointments.length === 0) {
        myBookingsList.innerHTML = `
          <div class="empty-bookings">
            <p style="font-size:1.1rem; margin-bottom:0.5rem; color:var(--gold-light);">No appointments found in the cosmos yet.</p>
            <p style="margin-bottom:1.5rem; font-size:0.85rem;">The cards await your calling.</p>
            <button type="button" class="btn-primary" id="btnGoBook" style="padding:0.6rem 1.4rem;">Book Your First Reading ✦</button>
          </div>
        `;
        const btnGoBook = document.getElementById('btnGoBook');
        if (btnGoBook) btnGoBook.addEventListener('click', () => showTab('book'));
        return;
      }

      myBookingsList.innerHTML = data.appointments.map(appt => {
        const isCancelled = appt.status === 'cancelled';
        const formattedDate = new Date(appt.date + 'T00:00:00').toLocaleDateString(undefined, {
          weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
        });

        return `
          <div class="booking-card" id="card-${appt._id}">
            <div class="booking-card-header">
              <span class="booking-service-title">🔮 ${appt.service}</span>
              <span class="status-badge status-${appt.status}">${appt.status}</span>
            </div>
            <div class="booking-meta">
              <span>📅 ${formattedDate}</span>
              <span>⏰ ${appt.time}</span>
              <span>👤 ${appt.name}</span>
            </div>
            ${appt.message ? `<p style="font-size:0.82rem; color:rgba(255,255,255,0.7); margin-top:0.2rem; font-style:italic;">"${appt.message}"</p>` : ''}
            <div class="booking-footer">
              <span>Booked on ${new Date(appt.createdAt).toLocaleDateString()}</span>
              ${!isCancelled ? `
                <button type="button" class="btn-cancel-appt" data-id="${appt._id}">
                  Cancel Session
                </button>
              ` : '<span style="color:#fca5a5;">Cancelled</span>'}
            </div>
          </div>
        `;
      }).join('');

      // Add cancel event listeners
      myBookingsList.querySelectorAll('.btn-cancel-appt').forEach(btn => {
        btn.addEventListener('click', async () => {
          const apptId = btn.getAttribute('data-id');
          if (!confirm('Are you sure you wish to cancel this reading session?')) return;

          btn.disabled = true;
          btn.textContent = 'Cancelling...';

          try {
            const cancelRes = await fetch(`/api/appointments/${apptId}/cancel`, {
              method: 'PATCH',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const cancelData = await cancelRes.json();
            if (cancelRes.ok && cancelData.success) {
              loadMyBookings();
            } else {
              alert(cancelData.message || 'Could not cancel booking.');
              btn.disabled = false;
              btn.textContent = 'Cancel Session';
            }
          } catch (e) {
            alert('Error cancelling booking.');
            btn.disabled = false;
            btn.textContent = 'Cancel Session';
          }
        });
      });

    } catch (err) {
      myBookingsList.innerHTML = `
        <div class="empty-bookings">
          <p style="color:#fca5a5;">Could not reach server to fetch your bookings.</p>
        </div>
      `;
    }
  }

  // Appointment Submission
  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const name    = document.getElementById('apptName').value.trim();
      const email   = document.getElementById('apptEmail').value.trim();
      const phone   = document.getElementById('apptPhone').value.trim();
      const service = document.getElementById('apptService')?.value || document.querySelector('input[name="apptServiceRadio"]:checked')?.value || 'Life Path Reading (75 min)';
      const date    = document.getElementById('apptDate').value;
      const time    = document.getElementById('apptTime').value;
      const message = document.getElementById('apptMessage').value.trim();

      if (!name || !email || !service || !date || !time)
        return showFormError(form, 'Please fill in all required fields.');

      const submitBtn = document.getElementById('apptSubmitBtn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '✦ Storing in the Cosmos...';
      }

      try {
        const token = localStorage.getItem('tarot_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/appointments', {
          method: 'POST',
          headers,
          body: JSON.stringify({ name, email, phone, service, date, time, message })
        });

        const data = await res.json();

        if (res.ok && data.success) {
          form.style.display = 'none';
          if (successMsg) {
            successMsg.style.display = 'block';
            const p = successMsg.querySelector('p');
            if (p) {
              p.innerHTML = `Your appointment for <strong style="color:var(--gold-light)">${service}</strong> on <strong style="color:var(--gold-light)">${date} at ${time}</strong> has been secured in our sacred database.<br/><br/>
Our reader has received your request and will confirm within <strong style="color:var(--gold-light)">24 hours</strong> at <strong style="color:var(--gold-light)">${email}</strong>.<br/><br/>
The stars are aligning just for you. ✦`;
            }
          }
        } else {
          showFormError(form, data.message || 'Could not record appointment. Please try again.');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = '✦ Send My Appointment Request';
          }
        }
      } catch (err) {
        console.error('Appointment submission error:', err);
        showFormError(form, 'Could not reach server. Please ensure the backend is running.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = '✦ Send My Appointment Request';
        }
      }
    });
  }
})();


// ── Navbar Auth State & Book Redirects ────────────────────────
(function initNavAuthState() {
  const user = JSON.parse(localStorage.getItem('tarot_user') || sessionStorage.getItem('tarot_user') || 'null');
  const navActions = document.querySelector('.nav-actions');

  if (user && navActions) {
    navActions.innerHTML = `
      <a href="profile.html" style="color:var(--gold-light);font-size:0.85rem;font-family:var(--font-serif);display:flex;align-items:center;gap:0.3rem;text-decoration:none;border:1px solid var(--border-bright);padding:0.4rem 0.9rem;border-radius:50px;transition:all 0.2s;" onmouseover="this.style.background='rgba(212,168,83,0.1)'" onmouseout="this.style.background='none'">
        ✦ ${user.name.split(' ')[0]}
      </a>
      <button id="logoutBtn" class="btn-ghost" style="padding:0.4rem 0.8rem;font-size:0.75rem;cursor:pointer;">
        Logout
      </button>
    `;


    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('tarot_token');
        localStorage.removeItem('tarot_user');
        sessionStorage.removeItem('tarot_user');
        window.location.reload();
      });
    }
  }

  const bookBtns = document.querySelectorAll('#bookNowBtn, #ctaBookBtn');
  bookBtns.forEach(btn => {
    btn.addEventListener('click', e => {
      const currentUser = localStorage.getItem('tarot_user') || sessionStorage.getItem('tarot_user');
      if (!currentUser) {
        e.preventDefault();
        window.location.href = 'login.html';
      }
    });
  });
})();
