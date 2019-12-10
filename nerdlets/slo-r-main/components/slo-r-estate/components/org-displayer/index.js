/**
 * Provides the component that a rolled up SLO attainment for an Organization
 *
 * @file
 * @author Gil Rice
 */
/** core */
import React from 'react';
import PropTypes from 'prop-types';

/** nr1 */
import { HeadingText, Spinner } from 'nr1';

/** local */
// import SLO_INDICATORS from '../../../../../shared/constants'; // TODO use with type statements
import ComponentErrorBudgetSLO from './component_eb_slo';

/** 3rd party */
import BootstrapTable from 'react-bootstrap-table-next';

/*
import filterFactory, {
  selectFilter,
  textFilter
} from 'react-bootstrap-table2-filter';
*/

/**
 * OrgDisplayer
 */
export default class OrgDisplayer extends React.Component {
  static propTypes = {
    org: PropTypes.object,
    timeRange: PropTypes.object
  }; // propTypes

  constructor(props) {
    super(props);

    this.state = {
      org_slo_data: null,
      tableData: []
    }; // state
  } // constructor

  // async _getScopedOrgSLOData(_scope) {

  //     return(__org_slo_data);
  // } //_getScopedOrgSLOData

  componentDidMount() {
    this._assembleOrganizationData();
  } // componentWillMount

  componentDidUpdate() {
    //
  }

  async _assembleOrganizationData() {
    // var __org_data = [];
    // const __data_promises = [];
    // var __org_slo_data = [];

    // get error budget SLOs
    const __eb_slos = this.props.org.slos.filter(function(value) {
      return value.type === 'error_budget';
    });

    // eslint-disable-next-line no-console
    console.debug('what is being returned here', __eb_slos);

    const __data_promises = __eb_slos.map(_eb_slo => {
      const slo_document = _eb_slo;
      const timeRange = this.props.timeRange;
      const sloPromise = ComponentErrorBudgetSLO.query({
        slo_document,
        timeRange
      });

      return sloPromise;
    });

    const __org_slo_data = await Promise.all(__data_promises);

    // var __org_slo_data = this._getScopedOrgSLOData("7_day");
    // eslint-disable-next-line no-console
    console.debug('dis is der org data ... ', __org_slo_data);

    this.setState({ org_slo_data: __org_slo_data });
    this.transformAndSetTableData({ data: __org_slo_data });
  } // _assembleOrganizationData

  transformAndSetTableData({ data }) {
    const tableData = data.map(row => {
      return this.transformData({ data: row });
    });
    this.setState({ tableData, org_slo_data: data });
  }

  /* Transform row data for bootstrap table */
  transformData({ data }) {
    const transformedData = {
      name: data.slo_document.name,
      target: data.slo_document.target,

      current: data.result_current.result,
      sevenDay: data.result_7_day.result,
      thirtyDay: data.result_30_day.result
    };

    return transformedData;
  }

  calculateTotalAttainment({ _slo_data }) {
    let __total_current_numerator = 0;
    let __total_current_denominator = 0;
    let __total_7_day_numerator = 0;
    let __total_7_day_denominator = 0;
    let __total_30_day_numerator = 0;
    let __total_30_day_denominator = 0;

    _slo_data.forEach(data => {
      __total_current_numerator =
        __total_current_numerator + data.result_current.numerator;
      __total_current_denominator =
        __total_current_denominator + data.result_current.denominator;

      __total_7_day_numerator =
        __total_7_day_numerator + data.result_7_day.numerator;
      __total_7_day_denominator =
        __total_7_day_denominator + data.result_7_day.denominator;

      __total_30_day_numerator =
        __total_30_day_numerator + data.result_30_day.numerator;
      __total_30_day_denominator =
        __total_30_day_denominator + data.result_30_day.denominator;
    });

    const currentAttainment =
      Math.round(
        (100 -
          (__total_current_numerator / __total_current_denominator) * 100) *
          1000
      ) / 1000;

    const sevenDayAttainment =
      Math.round(
        (100 - (__total_7_day_numerator / __total_7_day_denominator) * 100) *
          1000
      ) / 1000;

    const thirtyDayAttainment =
      Math.round(
        (100 - (__total_30_day_numerator / __total_30_day_denominator) * 100) *
          1000
      ) / 1000;

    return {
      currentAttainment,
      sevenDayAttainment,
      thirtyDayAttainment
    };
  }

  renderBootStrapTableView() {
    const { tableData } = this.state;
    // const indicatorOptions = SLO_INDICATORS.reduce(
    //   (previousValue, currentValue) => {
    //     previousValue[currentValue.value] = currentValue.label;
    //     return previousValue;
    //   },
    //   {}
    // );

    const columns = [
      {
        dataField: 'name', // SLO
        text: 'Name'
        // ,
        // filter: textFilter()
      },
      // {
      //   dataField: 'indicator',
      //   text: 'Indicator',
      //   formatter: cell => indicatorOptions[cell],
      //   filter: selectFilter({
      //     options: indicatorOptions
      //   })
      // },
      {
        dataField: 'current',
        text: 'Current'
      },
      {
        dataField: 'sevenDay',
        text: 'Seven Day'
      },
      {
        dataField: 'thirtyDay',
        text: 'Thirty Day'
      },
      {
        dataField: 'target',
        text: 'Target'
      }
    ];

    const rowEvents = {
      onClick: (e, row, rowIndex) => this.updateSloDocument(e, row, rowIndex)
    };

    return (
      <>
        <HeadingText spacingType={[HeadingText.SPACING_TYPE.EXTRA_LARGE]}>
          Service Level Objectives
        </HeadingText>
        <BootstrapTable
          keyField="name"
          data={tableData}
          columns={columns}
          // filter={filterFactory()}
          rowEvents={rowEvents}
          striped={false}
          wrapperClasses="slo-table-container"
          classes="slo-table"
        />
      </>
    );
  }

  renderOrganizationTable() {
    if (!this.state.org_slo_data) {
      return null;
    }

    // console.debug(this.state.org_slo_data);
    const attainment = this.calculateTotalAttainment({
      _slo_data: this.state.org_slo_data
    });

    return (
      <div>
        <p>ORGANIZATION: {this.props.org.orgName}</p>
        <br />
        <p>SLO Indicator: Error</p>
        <table>
          <thead>
            <tr>
              <th>SLO</th>
              <th>current</th>
              <th>7 day</th>
              <th>30 day</th>
              <th>target</th>
            </tr>
          </thead>
          <tbody>
            {this.state.org_slo_data.map((_slo_data, index) => {
              console.debug(_slo_data);
              const data = this.transformData({ data: _slo_data });

              return (
                <tr key={index}>
                  <td>{data.name}</td>
                  <td>{data.current}</td>
                  <td>{data.sevenDay}</td>
                  <td>{data.thirtyDay}</td>
                  <td>{data.target}</td>
                </tr>
              );
            })}

            <tr>
              <td>Total Attainment</td>
              <td>{attainment.currentAttainment}</td>
              <td>{attainment.sevenDayAttainment}</td>
              <td>{attainment.thirtyDayAttainment}</td>
              <td>--</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  render() {
    if (this.state.org_slo_data === null) {
      return (
        <div>
          <Spinner />
        </div>
      );
    } // if

    return (
      <>
        {this.renderOrganizationTable()}
        {this.renderBootStrapTableView()}
      </>
    );
  } // render
} // OrgDisplayer
