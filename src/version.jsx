export default function Version(){
  

    const dateFormat = (dateTime) => {
        const t = new Date(dateTime);
        const dayBefore = t.getDate();
        const day = dayBefore>=10?dayBefore:'0'+dayBefore;
        const hoursBefore = t.getHours();
        const hours = hoursBefore >= 10?hoursBefore:'0'+hoursBefore;
        const minutesBefore = t.getMinutes();
        const minutes = minutesBefore >=10 ?minutesBefore : '0' +minutesBefore;
        return day.toString()+hours.toString()+minutes.toString();
        
    }

    return<div className="version"><span>V0.0.1.{'undefined'?.slice(0,7)}</span>  </div>

}