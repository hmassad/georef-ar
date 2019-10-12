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
            id: columns[0].padStart(5, '0'),
            //n: columns[1]},
            p: [
                {y: "2010", p: parseInt(columns[2], 10)},
                {y: "2011", p: parseInt(columns[3], 10)},
                {y: "2012", p: parseInt(columns[4], 10)},
                {y: "2013", p: parseInt(columns[5], 10)},
                {y: "2014", p: parseInt(columns[6], 10)},
                {y: "2015", p: parseInt(columns[7], 10)},
                {y: "2016", p: parseInt(columns[8], 10)},
                {y: "2017", p: parseInt(columns[9], 10)},
                {y: "2018", p: parseInt(columns[10], 10)},
                {y: "2019", p: parseInt(columns[11], 10)},
                {y: "2020", p: parseInt(columns[12], 10)},
                {y: "2021", p: parseInt(columns[13], 10)},
                {y: "2022", p: parseInt(columns[14], 10)},
                {y: "2023", p: parseInt(columns[15], 10)},
                {y: "2024", p: parseInt(columns[16], 10)},
                {y: "2025", p: parseInt(columns[17], 10)},
            ]
        })
    })
    
    return population
}

module.exports = {
    load
}