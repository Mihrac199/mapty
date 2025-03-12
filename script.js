'use strict';

// ELEMENTS
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');


// FUNCTİONS
const validİnputs = (...inputs) => inputs.every(inp => Number.isFinite(inp));
const allPositive = (...inputs) => inputs.every(inp => inp > 0);


//////////////////////////////////////////////////////////////////


class Workout {

  date = new Date();
  id = (Date.now() + "").slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  _setDescription() {

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;

    return this.description;
  }

  _click() {
    this.click = 0;
    return this.click++;
  }

}


class Running extends Workout {

  type = "running";

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;

    this._setDescription();
    this.calcPace();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }

}


class Cycling extends Workout {

  type = "cycling";

  constructor(coords, distance, duration, elevGain) {
    super(coords, distance, duration);
    this.elevGain = elevGain;

    this._setDescription();
    this.calcSpeed();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }

}


//////////////////////////////////////////////////////////////////


class App {

  #map;
  #mapEvent;
  #mapZoomLevel = 16;
  #workouts = [];

  constructor() {
    this._getPosition();

    this._getLocaleStorage();

    form.addEventListener("click", this._newWorkout.bind(this));

    containerWorkouts.addEventListener("click", this._moveToPopup.bind(this));

    inputType.addEventListener('change', this._toggleElevationField);
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function () {
        alert('Could not get your position!');
      }
      );
    }
  }

  _loadMap(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const coords = [latitude, longitude];


    // LEAFLET LİBRARY
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // GET LOCALE STORAGE
    this.#workouts.forEach(work => {
      this._renderMarker(work);
    });
    // ALGORİTMAYA GÖRE BAŞA ALIP RENDERMARKER METHODUNU TEKRAR KULLANDIK.


    // İS CLİCK THE MAP
    this.#map.on('click', this._showForm.bind(this));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
      '';
    inputDistance.blur();
    inputDuration.blur();
    inputCadence.blur();
    inputElevation.blur();

    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(function () { form.style.display = "grid" }, 1000);
  }

  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(element) {
    element.preventDefault();


    // GET DATA FROM
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;

    const lat = this.#mapEvent.latlng.lat;
    const lng = this.#mapEvent.latlng.lng;
    const latlng = [lat, lng];
    let workout;

    // İF WORKOUT RUNNİNG CREATE RUNNİNG OBJECT
    if (type === 'running') {
      const cadence = +inputCadence.value;

      if (!validİnputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)) return;

      workout = new Running(latlng, distance, duration, cadence);
    }


    // İF WORKOUT CYCLİNG CREATE CYCLİNG OBJECT
    if (type === 'cycling') {
      const elevGain = +inputElevation.value;

      if (!validİnputs(distance, duration, elevGain) ||
        !allPositive(distance, duration, elevGain)) return;

      workout = new Cycling(latlng, distance, duration, elevGain);
    }

    // ADD NEW OBJECT WORKOUT AREA
    this.#workouts.push(workout);

    // RENDER MAP
    this._renderMarker(workout);

    // RENDER WORKOUT ON WORKOUT AREA
    this._renderWorkout(workout);

    // HİDE FORM + CLEAR PLACEHOLDER
    this._hideForm();

    // SET LOCALE STORAGE
    this._setLocaleStorage();
  }

  _renderMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(`${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${workout.description}`)
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
          `;

    if (workout.type === "running") {
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
        `;

    }

    if (workout.type === "cycling") {
      html += `
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
        `;

    }

    form.insertAdjacentHTML("afterend", html);

  }

  _moveToPopup(e) {

    const workoutEl = e.target.closest(".workout");
    if (!workoutEl) return;

    const workout = this.#workouts.find(work => work.id === workoutEl.dataset.id);

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    // workout._click();

  }

  _setLocaleStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workouts));
  }

  _getLocaleStorage() {
    const data = JSON.parse(localStorage.getItem("workouts"));

    if (!data) return;

    this.#workouts = data;

    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }

  _deleteLocaleStorage() {
    localStorage.removeItem("workouts");
    location.reload();
  }

}


//////////////////////////////////////////////////////////////////


const app = new App();