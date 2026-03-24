import { useState, useRef } from 'react' 
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid' 
import timeGridPlugin from '@fullcalendar/timegrid' 
import interactionPlugin from '@fullcalendar/interaction' 
import './App.css'

function App() {
  
  const [events, setEvents] = useState([
  ]);

  const nextCalendarRef = useRef(null);

  const handleDatesSet = (dateInfo) => {
    const nextCalApi = nextCalendarRef.current?.getApi();
    if (nextCalApi) {
      const currentStart = dateInfo.view.currentStart;
      const nextMonthDate = new Date(currentStart.getFullYear(), currentStart.getMonth() + 1, 1);
      nextCalApi.gotoDate(nextMonthDate);
    }
  };

  const handleDateClick = (arg) => {
    const currentViewMonth = arg.view.currentStart.getMonth();
    const clickedDate = new Date(arg.dateStr);
    const clickedMonth = clickedDate.getMonth();

    if (clickedMonth !== currentViewMonth) {
      alert("Możesz dodać wydarzenie tylko w wybranym miesiącu!");
      return;
    }

    const title = prompt('Nazwa nowego wydarzenia:');
    if (title && title.trim() !== "") {
      setEvents([...events, { 
        id: Math.random().toString(), 
        title: title.trim(), 
        start: arg.dateStr 
      }]);
    }
  };

  const handleEventClick = (clickInfo) => {
    const action = prompt("E - Edycja, U - Usuń, A - Anuluj").toUpperCase();
    
    if (action === 'U') {
      if (confirm(`Czy na pewno usunąć: '${clickInfo.event.title}'?`)) {
        setEvents(events.filter(ev => ev.id !== clickInfo.event.id));
        clickInfo.event.remove();
      }
    } else if (action === 'E') {
      const newTitle = prompt("Wpisz nową nazwę wydarzenia:", clickInfo.event.title);
      if (newTitle) {
        setEvents(events.map(ev => 
          ev.id === clickInfo.event.id ? { ...ev, title: newTitle } : ev
        ));
        clickInfo.event.setProp('title', newTitle);
      }
    }
  };

  const now = new Date();
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  return (
    <div class="App">
      <header class="app-header">
        <h1>Kalendarz</h1>
      </header>

      <div class="dual-calendar-wrapper">
        <div class="calendar-box main">
          <div class="box-header">
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