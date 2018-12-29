import React, { Component } from 'react';
import './App.css';
import { hot } from 'react-hot-loader';
import {
  Form,
  FormGroup,
  Row,
  Col,
  Button,
  Container,
  Input
} from 'reactstrap';
import moment from 'moment';
import 'bootstrap/dist/css/bootstrap.css';
import _ from 'lodash';
import Heatmap from './ModifiedCalendarHeatmap';
const {ipcRenderer} = window.require('electron');

class App extends Component {
  constructor(props) {
    super(props);
    let year = moment().year();
    this.state = {
      ...this.setYear(year),
      name: '',
      email: '',
    };
    this.handleYearChange = this.handleYearChange.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleContextmenu = this.handleContextmenu.bind(this);
    this.handleReset = this.handleReset.bind(this);
    this.handleSave = this.handleSave.bind(this);
    this.handleLoad = this.handleLoad.bind(this);
    this.handleExport = this.handleExport.bind(this);
    this.handleLoadResponse = this.handleLoadResponse.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }
  componentDidMount() {
    ipcRenderer.on('load-response', this.handleLoadResponse);
  }
  componentWillUnmount() {
    ipcRenderer.removeListener('load-response', this.handleLoadResponse);
  }
  handleYearChange(e) {
    this.setState({
      ...this.setYear(e.target.value)
    });
  }
  handleClick(d) {
    this.changeCount(d.index, 1);
  }
  handleContextmenu(e, d) {
    e.preventDefault();
    this.changeCount(d.index, -1);
  }
  handleReset() {
    this.setState({
      ...this.setYear(this.state.year)
    });
  }
  handleSave() {
    ipcRenderer.send('save', {
      year: this.state.year,
      data: this.state.data
    });
  }
  handleLoad() {
    ipcRenderer.send('load');
  }
  handleExport() {
    const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (this.state.name === '')
      alert('Please enter your name');
    else if (this.state.email === '')
      alert('Please enter your email');
    else if (!emailRegex.test(this.state.email))
      alert('Please enter a valid email address');
    else {
      ipcRenderer.send('export', {
        year: this.state.year,
        data: this.state.data,
        name: this.state.name,
        email: this.state.email
      });
    }
  }
  handleLoadResponse(event, arg) {
    this.setState({
      ...arg
    });
  }
  handleChange(e) {
    this.setState({
      [e.target.name]: e.target.value
    });
  }
  setYear(year) {
    return {
      year,
      data: this.makeData(year)
    };
  }
  changeCount(index, diff) {
    let data = this.state.data.splice(0);
    let count = data[index].count + diff;
    if (count < 0)
      count = 0;
    data[index] = {...data[index], count };
    this.setState({data});
  }
  makeData(year) {
    const start = moment().startOf('year').year(year);
    const end = moment(start).add(1, 'years');
    const diff = end.diff(start, 'days');
    return _.range(diff).map(index => {
      return {
        index,
        date: moment(start).add(index, 'days').toDate(),
        count: 0
      };
    });
  }
  render() {
    return (
      <Container fluid>
        <Row>
          <Col>
            <Form inline>
              <FormGroup>
                <select
                  className="form-control" 
                  value={this.state.year}
                  onChange={this.handleYearChange}
                >
                  {_.range(1970, moment().year() + 1).map(year => 
                    <option key={year} value={year}>{year}</option>
                  )}
                </select>
              </FormGroup>
              <FormGroup>
                <Button color="danger" onClick={this.handleReset}>Reset</Button>
              </FormGroup>
              <FormGroup>
                <Button color="success" onClick={this.handleSave}>Save</Button>
              </FormGroup>
              <FormGroup>
                <Button color="info" onClick={this.handleLoad}>Load</Button>
              </FormGroup>
              <FormGroup>
                <Input
                  type="text"
                  name="name"
                  placeholder="Name"
                  value={this.state.name}
                  onChange={this.handleChange}
                />
              </FormGroup>
              <FormGroup>
                <Input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={this.state.email}
                  onChange={this.handleChange}
                />
              </FormGroup>
              <FormGroup>
                <Button color="warning" onClick={this.handleExport}>Export</Button>
              </FormGroup>
            </Form>
          </Col>
        </Row>
        <Row>
          <Col>
            <Heatmap
              year={this.state.year}
              data={this.state.data}
              onClick={this.handleClick}
              onContextmenu={this.handleContextmenu}
            />
          </Col>
        </Row>
      </Container>
    );
  }
}

export default hot(module)(App);
