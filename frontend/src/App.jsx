import { useState, useRef, useEffect } from 'react' 
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid' 
import timeGridPlugin from '@fullcalendar/timegrid' 
import interactionPlugin from '@fullcalendar/interaction' 
import Swal from 'sweetalert2' 
import './App.css'

function App() {
  const [events, setEvents] = useState([]);
  const nextCalendarRef = useRef(null);

  const API_URL = 'https://kalendarz-app-web-d8g2cge8b2dcaac9.polandcentral-01.azurewebsites.net/api/events';

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

  const handleDateClick = async (arg) => {
    const currentViewMonth = arg.view.currentStart.getMonth();
    const clickedDate = new Date(arg.dateStr);
    const clickedMonth = clickedDate.getMonth();

    if (clickedMonth !== currentViewMonth) {
      Swal.fire('Uwaga!', 'Możesz dodać wydarzenie tylko w wybranym miesiącu!', 'warning');
      return;
    }
    const { value: title } = await Swal.fire({
      title: 'Nowe wydarzenie',
      input: 'text',
      inputLabel: 'Podaj nazwę nowego wydarzenia:',
      showCancelButton: true,
      confirmButtonText: 'Dodaj',
      cancelButtonText: 'Anuluj'
    });

    if (title && title.trim() !== "") {
      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: title.trim(), start: arg.dateStr })
        });
        const savedEvent = await response.json();
        setEvents([...events, savedEvent]);
      } catch (err) {
        Swal.fire('Błąd', 'Nie udało się zapisać wydarzenia.', 'error');
      }
    }
  };

  const handleEventClick = async (clickInfo) => {
    const result = await Swal.fire({
      title: clickInfo.event.title,
      text: 'Co chcesz zrobić z tym wydarzeniem?',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'Edytuj',
      denyButtonText: 'Usuń',
      cancelButtonText: 'Anuluj',
      confirmButtonColor: '#3788d8',
      denyButtonColor: '#dc3545'
    });

    if (result.isDenied) {
      const confirmDelete = await Swal.fire({
        title: 'Czy na pewno usunąć?',
        text: `'${clickInfo.event.title}' zniknie na zawsze!`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Tak, usuń',
        cancelButtonText: 'Nie'
      });

      if (confirmDelete.isConfirmed) {
        try {
          await fetch(`${API_URL}/${clickInfo.event.id}`, { method: 'DELETE' });
          setEvents(events.filter(ev => ev.id !== clickInfo.event.id));
          Swal.fire('Usunięto!', '', 'success');
        } catch (err) {
          Swal.fire('Błąd', 'Nie udało się usunąć.', 'error');
        }
      }
    } else if (result.isConfirmed) {
      const { value: newTitle } = await Swal.fire({
        title: 'Edycja wydarzenia',
        input: 'text',
        inputValue: clickInfo.event.title,
        showCancelButton: true,
        confirmButtonText: 'Zapisz',
        cancelButtonText: 'Anuluj'
      });

      if (newTitle && newTitle.trim() !== "") {
        try {
          await fetch(`${API_URL}/${clickInfo.event.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: newTitle.trim() })
          });
          setEvents(events.map(ev => 
            ev.id === clickInfo.event.id ? { ...ev, title: newTitle.trim() } : ev
          ));
          Swal.fire('Zapisano!', '', 'success');
        } catch (err) {
          Swal.fire('Błąd', 'Nie udało się zaktualizować.', 'error');
        }
      }
    }
  };

  const now = new Date();
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  return (
    <div className="App">
      <header className="app-header">
        <h1>Kalendarz 2</h1>
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
            buttonText={{ month: 'Miesiąc', week: 'Tydzień', day: 'Dzień' }}
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