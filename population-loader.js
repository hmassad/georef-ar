const fs = require('fs')

const load = (file) => {

    const population = []

    let isFirstLine = true

    fs.readFileSync(file, 'utf-8').split('\n').forEach(line => {

        if(isFirstLine)
        {
            isFirstLine = false
            return
        }

        line = line.substring(0, line.length - 1) // eliminar \r
        
        const columns = line.split(',')

        population.push({
            municipalityId: columns[0].padStart(5, '0'),
            //n: columns[1]},
            population: [
                {year: "2010", value: parseInt(columns[2], 10)},
                {year: "2011", value: parseInt(columns[3], 10)},
                {year: "2012", value: parseInt(columns[4], 10)},
                {year: "2013", value: parseInt(columns[5], 10)},
                {year: "2014", value: parseInt(columns[6], 10)},
                {year: "2015", value: parseInt(columns[7], 10)},
                {year: "2016", value: parseInt(columns[8], 10)},
                {year: "2017", value: parseInt(columns[9], 10)},
                {year: "2018", value: parseInt(columns[10], 10)},
                {year: "2019", value: parseInt(columns[11], 10)},
                {year: "2020", value: parseInt(columns[12], 10)},
                {year: "2021", value: parseInt(columns[13], 10)},
                {year: "2022", value: parseInt(columns[14], 10)},
                {year: "2023", value: parseInt(columns[15], 10)},
                {year: "2024", value: parseInt(columns[16], 10)},
                {year: "2025", value: parseInt(columns[17], 10)},
            ]
        })
    })
    
    return population
}

module.exports = {
    load
}