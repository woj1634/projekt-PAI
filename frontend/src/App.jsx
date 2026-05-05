import { useState, useRef, useEffect } from 'react' 
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid' 
import timeGridPlugin from '@fullcalendar/timegrid' 
import interactionPlugin from '@fullcalendar/interaction' 
import './App.css'

function App() {
  const [events, setEvents] = useState([]);
  const nextCalendarRef = useRef(null);

  // Adres Twojego backendu (w Dockerze będzie to ten sam host)
  const API_URL = 'http://localhost:5000/api/events';

  // 1. POBIERANIE DANYCH Z BACKENDU
  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => setEvents(data))
      .catch(err => console.error("Błąd podczas ładowania zdarzeń:", err));
  }, []);

  const handleDatesSet = (dateInfo) => {
    const nextCalApi = nextCalendarRef.current?.getApi();
    if (nextCalApi) {
      const currentStart = dateInfo.view.currentStart;
      const nextMonthDate = new Date(currentStart.getFullYear(), currentStart.getMonth() + 1, 1);
      nextCalApi.gotoDate(nextMonthDate);
    }
  };

  // 2. DODAWANIE WYDARZENIA (POST)
  const handleDateClick = async (arg) => {
    const currentViewMonth = arg.view.currentStart.getMonth();
    const clickedDate = new Date(arg.dateStr);
    const clickedMonth = clickedDate.getMonth();

    if (clickedMonth !== currentViewMonth) {
      alert("Możesz dodać wydarzenie tylko w wybranym miesiącu!");
      return;
    }

    const title = prompt('Podaj nazwę nowego wydarzenia:');
    if (title && title.trim() !== "") {
      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            title: title.trim(), 
            start: arg.dateStr 
          })
        });
        const savedEvent = await response.json();
        // Aktualizujemy stan o obiekt zwrócony z bazy (z ID)
        setEvents([...events, savedEvent]);
      } catch (err) {
        alert("Błąd podczas zapisywania!");
      }
    }
  };

  // 3. EDYCJA I USUWANIE (PUT / DELETE)
  const handleEventClick = async (clickInfo) => {
    const action = prompt("E - Edycja, U - Usuń, A - Anuluj").toUpperCase();

    if (action === 'U') {
      if (confirm(`Czy na pewno usunąć: '${clickInfo.event.title}'?`)) {
        try {
          await fetch(`${API_URL}/${clickInfo.event.id}`, { method: 'DELETE' });
          setEvents(events.filter(ev => ev.id !== clickInfo.event.id));
        } catch (err) {
          alert("Błąd podczas usuwania!");
        }
      }
    } else if (action === 'E') {
      const newTitle = prompt("Wpisz nową nazwę wydarzenia:", clickInfo.event.title);
      if (newTitle) {
        try {
          await fetch(`${API_URL}/${clickInfo.event.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: newTitle })
          });
          setEvents(events.map(ev => 
            ev.id === clickInfo.event.id ? { ...ev, title: newTitle } : ev
          ));
        } catch (err) {
          alert("Błąd podczas edycji!");
        }
      }
    }
  };

  const now = new Date();
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  return (
    <div className="App">
      <header className="app-header">
        <h1>Kalendarz</h1>
      </header>

      <div className="dual-calendar-wrapper">
        <div className="calendar-box main">
          <div className="box-header">
            <h3>Aktualny miesiąc</h3>
          </div>
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale="pl"
            events={events}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            datesSet={handleDatesSet}
            height="100%"
            headerToolbar={{ 
              left: 'prev,next', 
              center: 'title', 
              right: 'dayGridMonth,timeGridWeek,timeGridDay' 
            }}
            buttonText={{
              month: 'Miesiąc',
              week: 'Tydzień',
              day: 'Dzień'
            }}
          />
        </div>

        <div className="calendar-box side">
          <div className="box-header">
            <h3>Następny miesiąc</h3>
          </div>
          <FullCalendar
            ref={nextCalendarRef} 
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            initialDate={nextMonthStart}
            locale="pl"
            events={events}
            headerToolbar={{ left: '', center: 'title', right: '' }}
            height="100%"
          />
        </div>
      </div>
    </div>
  )
}

export default App