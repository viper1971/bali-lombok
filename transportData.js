const transportData = {
    longHaulFlights: {
        emirates: {
            id: "emirates",
            name: "Emirates (Odpolední)",
            airlineCode: "ae",
            hub: "Dubaj (DXB)",
            hubSub: "Nejvýhodnější",
            pricePerson: 22000,
            outbound: {
                dateInfo: "🛫 TAM • pá 6. 8.",
                depTime: "16:10",
                arrTime: "14:05+1",
                duration: "15h 55m",
                layover: "2h 25m",
                flights: "EK140 + EK348"
            },
            return: {
                dateInfo: "🛬 ZPĚT • st 25. 8.",
                depTime: "01:40",
                arrTime: "13:00",
                duration: "17h 20m",
                layover: "3h 45m",
                flights: "EK349 + EK139"
            }
        },
        emirates_flydubai: {
            id: "emirates_flydubai",
            name: "Emirates + flydubai",
            airlineCode: "ae",
            hub: "Dubaj (DXB)",
            hubSub: "Večerní odlet",
            pricePerson: 22000,
            outbound: {
                dateInfo: "🛫 TAM • pá 6. 8.",
                depTime: "21:15",
                arrTime: "21:45+1",
                duration: "18h 30m",
                layover: "4h 35m",
                flights: "EK2239 + EK352"
            },
            return: {
                dateInfo: "🛬 ZPĚT • st 25. 8.",
                depTime: "00:50",
                arrTime: "13:00",
                duration: "18h 10m",
                layover: "4h 30m",
                flights: "EK353 + EK139"
            }
        },
        finnair: {
            id: "finnair",
            name: "Finnair (Helsinky)",
            airlineCode: "fi",
            hub: "Helsinky (HEL)",
            hubSub: "Severní trasa",
            pricePerson: 24900,
            outbound: {
                dateInfo: "🛫 TAM • pá 6. 8.",
                depTime: "19:30",
                arrTime: "18:30+1",
                duration: "17h 00m",
                layover: "1h 50m",
                flights: "AY1226 + AY131"
            },
            return: {
                dateInfo: "🛬 ZPĚT • út 24. 8.",
                depTime: "21:35",
                arrTime: "10:50+1",
                duration: "19h 15m",
                layover: "3h 40m",
                flights: "AY132 + AY1223"
            }
        },
        swiss: {
            id: "swiss",
            name: "SWISS (Curych)",
            airlineCode: "ch",
            hub: "Curych (ZRH)",
            hubSub: "Nejrychlejší let",
            pricePerson: 25500,
            outbound: {
                dateInfo: "🛫 TAM • pá 6. 8.",
                depTime: "19:30",
                arrTime: "17:10+1",
                duration: "15h 40m",
                layover: "1h 50m",
                flights: "LX1489 + LX176"
            },
            return: {
                dateInfo: "🛬 ZPĚT • út 24. 8.",
                depTime: "23:25",
                arrTime: "08:40+1",
                duration: "15h 15m",
                layover: "1h 10m",
                flights: "LX177 + LX1484"
            }
        },
        turkish: {
            id: "turkish",
            name: "Turkish Airlines",
            airlineCode: "tr",
            hub: "Istanbul (IST)",
            hubSub: "Top servis",
            pricePerson: 26900,
            outbound: {
                dateInfo: "🛫 TAM • pá 6. 8.",
                depTime: "19:15",
                arrTime: "17:55+1",
                duration: "16h 40m",
                layover: "3h 05m",
                flights: "TK1770 + TK54"
            },
            return: {
                dateInfo: "🛬 ZPĚT • út 24. 8.",
                depTime: "23:05",
                arrTime: "08:35+1",
                duration: "15h 30m",
                layover: "1h 45m",
                flights: "TK55 + TK1767"
            }
        }
    },
    localFlights: {
        pricePerson: 5206
    },
    islandTransfers: {
        A: { pricePerson: 2240 },
        B: { pricePerson: 1343 }
    }
};