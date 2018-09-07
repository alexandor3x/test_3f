import React from 'react';
import Helmet from 'react-helmet';
import Spider from 'images/404.svg';
import Layout from '../components/Layout';

const NotFoundPage = () => {
  
  var loc = {
    text: '404',
    path: '/404/',
  };
  return (
  <Layout location = {loc}><div className="notfound">
    <Helmet title="404" />
    <div className="container notfound__content">
      <div className="notfound__text">
        <h1>Oops!</h1>
        <p>Looks like this page doesn&#39;t exist...</p>
      </div>
      <img src={Spider} alt="spider" width="371" height="344" />
    </div>
  </div></Layout>
)};

export default NotFoundPage;
