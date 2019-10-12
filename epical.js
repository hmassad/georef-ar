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

module.exports = {
    epiweekToDate
}
