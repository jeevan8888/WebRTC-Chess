import React from 'react';
import { useNavigate } from 'react-router-dom';

const NoMatch = () => {

    const navigate = useNavigate();

    setTimeout(() => {
        navigate('/');
      }, 2000);
  return (
    <div style={{
        backgroundColor: '#FFFFFF',
        boxShadow: '0px 0px 10px 0px #000000',
        padding: '2rem',
        textAlign: 'center',
        fontSize: '2rem',
        marginTop: '2rem'
      }}>
        404 Not Found
      </div>
  );
};

export default NoMatch;