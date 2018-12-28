import React, {Component} from 'react';
import CalendarHeatmap from 'reactjs-calendar-heatmap';
import {event} from 'd3';
import moment from 'moment';

class ModifiedCalendarHeatmap extends Component {
  constructor(props) {
    super(props);
    this.storeRef = this.storeRef.bind(this);
    this.handleContextmenu = this.handleContextmenu.bind(this);
  }
  storeRef(ref) {
    this.calendar = ref;
  }
  handleClick(d) {
    if (this.props.onClick)
      this.props.onClick(d);
  }
  handleContextmenu(d) {
    if (this.props.onContextmenu)
      this.props.onContextmenu(event, d);
  }
  refresh() {
    this.calendar.selected = {
      date: moment().startOf('year').year(this.props.year).toDate(),
      details: [],
      summary: []
    };
    this.calendar.drawChart();
    this.calendar.items.selectAll('.item-circle')
    .on('click', this.props.onClick)
    .on('contextmenu', this.handleContextmenu);

    this.calendar.buttons.selectAll('.button').remove()
    this.calendar.labels.selectAll('.label-month')
    .on('click', d => {});
  }
  componentDidMount() {
    this.refresh();
  }
  componentDidUpdate() {
    this.refresh();
  }
  render() {
    console.log('render');
    let data = this.props.data.map(el => {
      return {
        date: el.date,
        total: el.count,
        details: [{
          name: `Count: ${el.count}`,
          date: el.date,
          value: 1
        }],
        summary: [{
          name: `Count: ${el.count}`,
          date: el.date,
          value: 1
        }]
      };
    });
    return <CalendarHeatmap
      data={data}
      color={this.props.color}
      overview="year"
      ref={this.storeRef}
    />;
  }
}

export default ModifiedCalendarHeatmap;
