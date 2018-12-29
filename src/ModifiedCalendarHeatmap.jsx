import React, {Component} from 'react';
import CalendarHeatmap from 'reactjs-calendar-heatmap';
import {event} from 'd3';
import moment from 'moment';

class ModifiedCalendarHeatmap extends Component {
  constructor(props) {
    super(props);
    this.storeRef = this.storeRef.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleContextmenu = this.handleContextmenu.bind(this);
    this.calcDimensions = this.calcDimensions.bind(this);
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
    // Define start and end date of the selected year
    let start_of_year = moment().startOf('year').year(this.props.year);

    let calcItemX = (d) => {
      let date = moment(d.date);
      let dayIndex = Math.round((date - moment(start_of_year).startOf('week')) / 86400000);
      let colIndex = Math.trunc(dayIndex / 7);
      return colIndex * (this.calendar.settings.item_size + this.calendar.settings.gutter) + this.calendar.settings.label_padding;
    }

    let calcItemY = d => {
      return this.calendar.settings.label_padding + moment(d.date).weekday() * (this.calendar.settings.item_size + this.calendar.settings.gutter);
    }

    this.calendar.selected = {
      date: moment().startOf('year').year(this.props.year).toDate(),
      details: [],
      summary: []
    };
    this.calendar.drawChart();
    this.calendar.items.selectAll('.item-circle')
    .style('stroke-width', '1px')
    .style('stroke', '#000000')
    .on('mouseover', d => {
      let tooltip_html = `<div>${moment(d.date).format('dddd, MMM Do YYYY')}</div><br/>`;
      tooltip_html += `<div><span><strong>Count</strong></span><span>${d.total}</span></div>`;
      // Calculate tooltip position
      let x = calcItemX(d) + this.calendar.settings.item_size;
      if (this.calendar.settings.width - x < (this.calendar.settings.tooltip_width + this.calendar.settings.tooltip_padding * 3)) {
        x -= this.calendar.settings.tooltip_width + this.calendar.settings.tooltip_padding * 2;
      }
      let y = calcItemY(d) + this.calendar.settings.item_size;
      this.calendar.tooltip.html(tooltip_html)
      .style('left', x + 'px')
      .style('top', y + 'px')
      .transition()
      .duration(this.calendar.settings.transition_duration / 2)
      .style('opacity', 1);
    })
    .on('mouseout', () => this.calendar.hideTooltip())
    .on('click', this.handleClick)
    .on('contextmenu', this.handleContextmenu);

    this.calendar.buttons.selectAll('.button').remove()
    this.calendar.labels.selectAll('.label-month')
    .on('click', d => {});
  }
  componentDidMount() {
    this.calendar.settings.transition_duration = 10;

    window.removeEventListener('resize', this.calendar.calcDimensions);
    this.originalCalcDimensions = this.calendar.calcDimensions;
    this.calendar.calcDimensions = this.calcDimensions;
    window.addEventListener('resize', this.calendar.calcDimensions);

    this.refresh();
  }
  componentDidUpdate() {
    this.refresh();
  }
  calcDimensions() {
    this.originalCalcDimensions();
    this.componentDidUpdate();
  }
  render() {
    let data = this.props.data.map(el => {
      return {
        index: el.index,
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
