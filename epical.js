// http://www.angulartutorial.net/2017/09/calculate-epi-week-from-date-convert.html

const epiweekToDate = (w, y) => {
    //w = week number(Ex:12),y = year(Ex:2016)
    var _days;
    if (w === 53) {
        _days = (1 + (w - 1) * 7);
    } else {
        _days = (w * 7); 
    }
    const _date = new Date(y, 0, _days)
    _date.setDate(_date.getDate() - _date.getDay())
    return _date;
}

const dateToEpiWeek = date => {
//     function calculateEpiWeekFromDate(value) 
// {
//  Date.prototype.getWeek = function () 
//  {
//    var target = new Date(this.valueOf());
   
//    var dayPs = (this.getDay() + 7) % 7;
   
//    target.setDate(target.getDate() - dayPs + 3);
   
//    var jan4 = new Date(target.getFullYear(), 0, 4);
   
//    var dayDifference = (target - jan4) / 86400000;
   
//    if (new Date(target.getFullYear(), 0, 1).getDay() < 4)
//    {
//   return 1 + Math.ceil(dayDifference / 7);
//    }
//    else 
//    {
//   return Math.ceil(dayDifference / 7);
//    }
//  };
 
//  var weekNumber = new Date(value).getWeek()
 
//  var year = getYear(value, weekNumber);
 
//  return weekNumber + ' ' + year;

// } 


// //For getting year for epi Week 
// function getYear(value, weekNumber)
// {
//  var year = parseInt(value.split(' ')[2]);
//  if (value.split(' ')[0] == 'Jan') {
//   if (weekNumber > 40) {
//     year = year - 1;
//   }
//  }
//  if (value.split(' ')[0] == 'Dec') {
//   if (weekNumber < 2) {
//     year = year + 1;
//   }
//  }
//  return year.toString();
// }
}

module.exports = {
    epiweekToDate
}
