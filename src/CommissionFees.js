import React from "react";
import "./App.css";

//constants
const CASH_IN = 'CASH_IN'
const CASH_OUT = 'CASH_OUT'
const NATURAL = 'NATURAL'
const JURIDICAL = 'JURIDICAL'
const CASH_IN_CONFIG_URL = 'http://private-38e18c-uzduotis.apiary-mock.com/config/cash-in';
const CASH_OUT_NATURAL_CONFIG_URL = 'http://private-38e18c-uzduotis.apiary-mock.com/config/cash-out/natural'
const CASH_OUT_JURIDICAL_CONFIG_URL = 'http://private-38e18c-uzduotis.apiary-mock.com/config/cash-out/juridical'
const HEADER = 'Commission Fees Demo'
const SUBMIT = 'Submit'

export class CommissionFees extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      url: 'https://run.mocky.io/v3/80c0d59f-cf98-45fc-a580-11accac1c7cc', //placeholder sample url
      fees: [],
      cash_in_config: {},
      cash_out_natural_config: {},
      cash_out_juridical_config: {},
      users: []
    };
  }

  componentDidMount(){
    fetch(CASH_IN_CONFIG_URL)
    .then(res => res.json())
    .then(cash_in_config => {
      this.setState({cash_in_config})
    })

    fetch(CASH_OUT_NATURAL_CONFIG_URL)
    .then(res => res.json())
    .then(cash_out_natural_config => {
      this.setState({cash_out_natural_config})
    })

    fetch(CASH_OUT_JURIDICAL_CONFIG_URL)
    .then(res => res.json())
    .then(cash_out_juridical_config => {
      this.setState({cash_out_juridical_config})
    })

  }

  handleChange = (event) => {
    this.setState({url: event.target.value});
  }

  getUserTransactions = (data) => {
    const users = [];
    const uniqueIds = [];
    const map = new Map();
    for (const ids of data) {
        if(!map.has(ids.user_id)){
            map.set(ids.user_id, true); 
            uniqueIds.push(ids.user_id);
        }
    }
    uniqueIds.forEach(id => {
      const filtered = data.filter(user => user.user_id === id); 
      users.push({id: id, transactions: filtered})
    });
    this.setState({users}, () => this.displayCommission(data))
  }

  displayCommission = (data) => {
    const fees = []
    data.map((user) =>{
      fees.push(this.commissionHelper(user.operation.amount, this.determineTransactionType(user.type), this.determineUserType(user.user_type), user.user_id))
      return null
    })
    this.setState({fees})
  }

  handleSubmit = (event) => {
    event.preventDefault();
    fetch(this.state.url)
    .then(res => res.json())
    .then(data => {
      this.getUserTransactions(data)
    })
  }

  determineTransactionType=(transactionType)=>{
    switch(transactionType) {
      case 'cash_in': {
          return CASH_IN;
      }
      case 'cash_out': {
          return CASH_OUT;
      }
      default: {
          console.log('err', transactionType)
          break;
      }
   }
  }

  determineUserType=(userType)=>{
    switch(userType) {
      case 'natural': {
         return NATURAL
      }
      case 'juridical': {
         return JURIDICAL
      }
      default: {
        console.log('err', userType)
         break;
      }
   }
  }

  checkUserLimit = (userId) => {
    const transactions = this.state.users.find(user => {
      return user.id === userId
    })
    //...
  }

  commissionHelper = (amount, transactionType, userType, userId) =>{

    const {cash_in_config, cash_out_natural_config, cash_out_juridical_config} = this.state
    const COMMISSION_CEILING = cash_in_config.max.amount
    const COMMISSION_FLOOR = cash_out_juridical_config.min.amount
    const COMMISSION_WEEKLY_LIMIT = cash_out_natural_config.week_limit.amount
    
    if(transactionType === CASH_IN){
      const commissionFee = (cash_in_config.percents/100) * amount
      
      return commissionFee < COMMISSION_CEILING ? commissionFee : COMMISSION_CEILING
    }

    if(transactionType === CASH_OUT){
      let commissionFee;

      if(userType === NATURAL){
        //TODO: track user limit
        this.checkUserLimit(userId)
        commissionFee = (cash_out_natural_config.percents/100) * amount
        return amount < COMMISSION_WEEKLY_LIMIT ? 0: (cash_out_natural_config.percents/100) * (amount-COMMISSION_WEEKLY_LIMIT)
      }
      
      if(userType === JURIDICAL){
        commissionFee = (cash_out_juridical_config.percents/100) * amount     
        return commissionFee > COMMISSION_FLOOR ? commissionFee : COMMISSION_FLOOR
      }

    }
  }

  render(){
    return (
    <>
      <div className="container">
          <div className="header">{HEADER}</div>
          <input className="input-url" type="text" onChange={this.handleChange} value={this.state.url}/>
          <br/>
          <button className="button" onClick={this.handleSubmit} disabled={this.state.url.length===0}>{SUBMIT}</button>
          <div className="display">
              {this.state.fees.map((fee, idx) => (
                <span key={idx}>{(Math.round(fee * 100) / 100).toFixed(2)}</span>
              ))}
          </div>
      </div>
    </>
    );
  }
};