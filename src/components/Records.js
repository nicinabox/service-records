import React, { Component } from 'react'
import { connect } from 'react-redux'
import { sortBy } from 'lodash'
import { format as formatDate } from 'date-fns'
import * as recordsActions from '../actions/recordsActions'
import Modal from './Modal'
import RecordForm from './RecordForm'

export class Records extends Component {
  constructor(props) {
    super(props)

    this.state = {
      years: this.getSections(props.state.records),
      records: this.groupByDate(props.state.records)
    }
  }

  componentDidMount() {
    this.props.fetchRecords(this.props.vehicleId)
  }

  componentWillReceiveProps(nextProps) {
    let records = nextProps.state.records.filter(r => {
      let re = new RegExp(nextProps.search, 'i')
      return re.test(r.notes)
    })

    this.setState({
      years: this.getSections(records),
      records: this.groupByDate(records)
    })
  }

  getDataSource(rows, sections) {
    if (!sections) sections = Object.keys(rows)

    return {
      sections: sections,
      rows: rows
    }
  }

  getSections(records) {
    let blob = this.groupByDate(records)
    return Object.keys(blob).sort((a, b) => b - a)
  }

  groupByDate(records) {
    return sortBy(records, 'date').reverse()
      .reduce((result, record) => {
        let date = new Date(record.date).getFullYear()

        result[date] = (result[date] || []).concat(record)
        return result
      }, {})
  }

  handleShowEdit(e, record) {
    e.preventDefault()

    Modal.open({
      el: e.currentTarget,
      style: {
        top: -e.currentTarget.offsetHeight - 15,
        width: e.currentTarget.offsetWidth,
      },
      children: (
        <RecordForm
          vehicle={this.props.state.vehicle}
          onSubmit={(props) => {
            this.props.updateRecord(this.props.state.vehicle.id, props.id, props)
            Modal.close()
          }}
          onConfirmDestroy={(id) => {
            this.props.destroyRecord(this.props.state.vehicle.id, id)
            Modal.close()
          }}
          {...record} />
      )
    })
  }

  renderTable(records) {
    return (
      <table className="table table-striped">
        <tbody>
          {records.map((record, i) => {
            return (
              <tr className="record" key={i} onClick={(e) => this.handleShowEdit(e, record)}>
                <td className="date">{formatDate(record.date, 'MMM DD')}</td>
                {record.mileage ? (
                  <td className="mileage">{record.mileage.toLocaleString()}</td>
                ) : <td />}

                {this.props.state.vehicle.enableCost && (
                  <td className="cost">{record.cost}</td>
                )}

                <td className="notes">{record.notes}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }

  renderRecords(records) {
    if (window.innerWidth >= 768) return this.renderTable(records)

    return records.map((record, i) => {
      return (
        <div className="record" key={i} onClick={(e) => this.handleShowEdit(e, record)}>
          <header>
            <span className="date">{formatDate(record.date, 'MMM DD')}</span>
            <span className="mileage">{record.mileage.toLocaleString()}</span>

            {this.props.state.vehicle.enableCost && (
              <span className="cost">{record.cost}</span>
            )}
          </header>
          <p className="notes">
            {record.notes}
          </p>
        </div>
      )
    })
  }

  render() {
    let { records, years } = this.state

    return (
      <div id="records">
        {!years.length && (
          <div className="no-results">
            <h3>You don't have any records yet.</h3>
            <p>
              Try adding your purchase as the first one.
            </p>
          </div>
        )}

        {years.map((year) => {
          return (
            <div className="record-year" key={year}>
              <h3>{year}</h3>
              <div className="records-container">
                {this.renderRecords(records[year])}
              </div>
            </div>
          )
        })}
      </div>
    )
  }
}

export default connect((state, props) => ({
  state: {
    vehicle: state.vehicles.find(v => v.id === +props.vehicleId) || {},
    records: state.records[props.vehicleId] || []
  }
}), recordsActions)(Records)
