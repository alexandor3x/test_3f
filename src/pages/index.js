import React from 'react';
import Helmet from 'react-helmet';
import Cover from 'components/home/Cover';
import Ecosystem from 'components/home/Ecosystem';
import AllInOne from 'components/home/AllInOne';
import Giants from 'components/home/Giants';
import Expose from 'components/home/Expose';
import Schema from 'components/home/Schema';
import References from 'components/home/References';
import Seo from 'components/home/Seo';
import Firebase from '../utils/firebase'
import Layout from '../components/Layout';

class IndexPage extends React.Component {

  componentDidMount() {
    try {
      this.firebase = new Firebase();
      this.firebase.fbase().askForPermissioToReceiveNotifications();
    } catch (e) {
      console.log("error: " + e);
    }
  }

  render = () => {
    return (
      <Layout location={{
        text: 'Home',
        path: '/',
      }}><div className="home">
      <Helmet title="Innovación continua" />
      <Cover />
      <Ecosystem />
      <AllInOne />
      <Giants />
      <Schema />
      <Expose />
      <Seo />
      <References />
    </div></Layout>)

  }
}


export default IndexPage;
