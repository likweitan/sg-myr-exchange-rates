import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

const CurrencyExchangeApp = () => {
  const [data, setData] = useState([]);
  const [timeFrame, setTimeFrame] = useState('day');
  const [chartData, setChartData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [latestRate, setLatestRate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/likweitan/CIMB-exchange-rates/main/exchange_rates.json')
      .then(response => response.json())
      .then(jsonData => {
        const formattedData = jsonData.map(item => ({
          timestamp: item.timestamp,
          rate: parseFloat(item.exchange_rate)
        })).sort((a, b) => b.timestamp - a.timestamp); // Sort by timestamp descending
        setData(formattedData);
        setLatestRate(formattedData.at(-1)); // Set the latest rate
      });
  }, []);

  useEffect(() => {
    const processData = () => {
      let groupedData = {};
      data.forEach(item => {
        const date = new Date(item.timestamp);
        let key;
        switch (timeFrame) {
          case 'hour':
            key = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()).getTime();
            break;
          case 'day':
            key = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
            break;
          case 'month':
            key = new Date(date.getFullYear(), date.getMonth()).getTime();
            break;
          case 'year':
            key = new Date(date.getFullYear(), 0).getTime();
            break;
          default:
            key = date.getTime();
        }
        if (!groupedData[key] || item.rate > groupedData[key].rate) {
          groupedData[key] = item;
        }
      });

      const processed = Object.values(groupedData).map(item => ({
        date: formatDate(item.timestamp),
        timestamp: item.timestamp,
        rate: item.rate
      }));

      setChartData(processed); // Keep the chart data in ascending order
      setTableData([...processed].reverse()); // Reverse the data for the table
    };

    processData();
  }, [data, timeFrame]);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    switch (timeFrame) {
      case 'hour':
        return date.toLocaleString(undefined, {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      case 'day':
        return date.toLocaleDateString();
      case 'month':
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
      case 'year':
        return date.getFullYear().toString();
      default:
        return date.toLocaleDateString();
    }
  };

  const customTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc' }}>
          <p>{formatDate(payload[0].payload.timestamp)}</p>
          <p>Rate: {payload[0].value.toFixed(4)}</p>
        </div>
      );
    }
    return null;
  };

  // Pagination calculations
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = tableData.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(tableData.length / recordsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div>
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>MYR Exchange Rate</h1>

        {latestRate && (
          <div style={{
            backgroundColor: '#f0f0f0',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>Latest Exchange Rate</h2>
            <p style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
              {latestRate.rate.toFixed(4)} MYR
            </p>
            <p style={{ fontSize: '14px', color: '#666' }}>
              Last updated: {new Date(latestRate.timestamp).toLocaleString()}
            </p>
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="timeframe-select" style={{ marginRight: '10px' }}>Select Time Frame:</label>
          <select
            id="timeframe-select"
            value={timeFrame}
            onChange={(e) => setTimeFrame(e.target.value)}
            style={{ padding: '5px', borderRadius: '4px' }}
          >
            <option value="hour">Hourly</option>
            <option value="day">Daily</option>
            <option value="month">Monthly</option>
            <option value="year">Yearly</option>
          </select>
        </div>
        <Container>
        <Row>
        <Col xs={12} md={6} lg={6}>
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'semibold', marginBottom: '10px' }}>Exchange Rate Chart</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip content={customTooltip} />
              <Legend />
              <Line type="monotone" dataKey="rate" stroke="#8884d8" name="MYR Exchange Rate" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        </Col>
        <Col xs={12} md={6} lg={6}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 'semibold', marginBottom: '10px' }}>Historical Data Table</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Date</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>MYR Exchange Rate</th>
              </tr>
            </thead>
            <tbody>
              {currentRecords.map((item, index) => (
                <tr key={index}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.date}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.rate.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination controls */}
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                onClick={() => handlePageChange(index + 1)}
                style={{
                  padding: '5px 10px',
                  margin: '0 5px',
                  borderRadius: '4px',
                  backgroundColor: currentPage === index + 1 ? '#8884d8' : '#f0f0f0',
                  color: currentPage === index + 1 ? '#fff' : '#000',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {index + 1}
              </button>
            ))}
          </div>
          
      
        </div>
        </Col>
      </Row>
      </Container>
      </div>
    </div>
  );
};

export default CurrencyExchangeApp;