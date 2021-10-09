import React from 'react';
import './ExtraWalletReceiveAddressesModal.css';
import Modal from '../components/Modal';
import Wallet, {NumPathsPerPage, WalletUnlockStrategy} from '../services/Wallet';
import {logoutWalletOnly, setNetwork, unlockExtraWallet} from '../state/actions/Wallet';
import {copyToClipboard} from '../utils/Utils';
import Alerts from '../services/Alerts';
import {store} from '../state';
import {hideModal} from '../state/actions/Modals';
import MDSpinner from 'react-md-spinner';
import Api from '../services/Api';
import {zipMap} from '../utils/Utils';
import Theta from '../services/Theta';
import _ from 'lodash';
import GradientButton from '../components/buttons/GradientButton';

export class ExtraWalletAddressRow extends React.Component {
  constructor(props) {
    super(props);
    this.copyAddress = this.copyAddress.bind(this);
    this.state = {
      tfuelWei: null,
      thetaWei: null,
      isLoading: true,
    };
  }

  copyAddress(address) {
    copyToClipboard(address);
    Alerts.showSuccess('Your address has been copied');
  }

  async fetchBalances(address) {
    let response = await Api.fetchWallet(address, {network: Theta.getChainID()});

    if (response) {
      let responseJSON = await response.json();
      let {balances} = responseJSON;
      let balancesByType = null;

      if (balances) {
        balancesByType = zipMap(
          balances.map(({type}) => type),
          balances.map(({value}) => value)
        );
      } else {
        balancesByType = {
          theta: 0,
          tfuel: 0,
        };
      }

      this.setState({
        balances: balancesByType,
        isLoading: false,
      });
    }
  }

  componentDidMount() {
    let {address} = this.props;
    this.fetchBalances(address);
  }

  render() {
    let {address, serializedPath, isSelected, onClick} = this.props;
    let {balances, isLoading} = this.state;

    let balanceView = null;

    if (isLoading) {
      balanceView = <MDSpinner singleColor="#ffffff" />;
    } else {
      balanceView = (
        <React.Fragment>
          <div className="ExtraWalletReceiveAddressesModal__amount-container">
            <div className="ExtraWalletReceiveAddressesModal__amount">{balances.theta}</div>
            <img
              className="ExtraWalletReceiveAddressesModal__amount-icon"
              src="./img/tokens/theta_large@2x.png"
            />
          </div>
          <div className="ExtraWalletReceiveAddressesModal__amount-container">
            <div className="ExtraWalletReceiveAddressesModal__amount">{balances.tfuel}</div>
            <img
              className="ExtraWalletReceiveAddressesModal__amount-icon"
              src="./img/tokens/tfuel_large@2x.png"
            />
          </div>
        </React.Fragment>
      );
    }

    return (
      <a className="ExtraWalletReceiveAddressesModal__row" key={serializedPath} onClick={onClick}>
        <img
          className="ExtraWalletReceiveAddressesModal__checkmark-icon"
          src={
            isSelected
              ? './img/icons/checkmark-green@2x.png'
              : './img/icons/checkmark-transparent@2x.png'
          }
        />
        <div className="ExtraWalletReceiveAddressesModal__row-address">
          {address}
          <img
            title="Copy Address"
            src="./img/icons/copy@2x.png"
            style={{height: '15px', marginLeft: '5px'}}
            onClick={() => this.copyAddress(address)}
          />
        </div>

        <div className="ExtraWalletReceiveAddressesModal__row-balance">{balanceView}</div>
      </a>
    );
  }
}

export default class ExtraWalletReceiveAddressesModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      page: 0,
      addressChosen: null,
      pathChosen: null,
      addresses: null,
      chainId: Theta.getChainID(),
    };

    this.handleUnlockWalletClick = this.handleUnlockWalletClick.bind(this);
    this.handlePrevPageClick = this.handlePrevPageClick.bind(this);
    this.handleNextPageClick = this.handleNextPageClick.bind(this);
  }

  isValid() {
    return this.state.addressChosen != null;
  }

  handleUnlockWalletClick() {
    let wallet = Wallet.unlockWalletFromExtraAddress(this.state.pathChosen);
    store.dispatch(logoutWalletOnly());
    //stay with the same network
    store.dispatch(setNetwork(this.state.chainId));
    store.dispatch(
      unlockExtraWallet(WalletUnlockStrategy.PRIVATE_KEY, {privateKey: wallet.privateKey})
    );
    store.dispatch(hideModal());
  }

  componentDidMount() {
    let addresses = Wallet.getPageExtraAddresses('0');
    this.setState({
      addresses: addresses,
    });
  }

  handleAddressClick(address) {
    if (address.address === this.state.addressChosen) {
      //Unselect this address

      this.setState({
        addressChosen: null,
        pathChosen: null,
      });
    } else {
      //Select this address

      this.setState({
        addressChosen: address.address,
        pathChosen: address.serializedPath,
      });
    }
  }

  handlePrevPageClick() {
    this.setState({
      page: this.state.page - 1,
      addressChosen: null,
      pathChosen: null,
    });
  }

  async handleNextPageClick() {
    let nextPage = this.state.page + 1;
    this.setState({
      page: nextPage,
      addressChosen: null,
      pathChosen: null,
    });

    if (this.state.addresses.length < (nextPage + 1) * NumPathsPerPage) {
      let addresses = Wallet.getPageExtraAddresses(nextPage);
      this.setState({
        addresses: [...this.state.addresses, ...addresses],
      });
    }
  }

  render() {
    let isDisabled = this.isValid() === false;

    let renderDataRow = (addressInfo) => {
      if (addressInfo) {
        return (
          <ExtraWalletAddressRow
            address={addressInfo.address}
            serializedPath={addressInfo.serializedPath}
            key={addressInfo.address}
            isSelected={this.state.addressChosen === addressInfo.address}
            onClick={() => {
              this.handleAddressClick(addressInfo);
            }}
          ></ExtraWalletAddressRow>
        );
      }
    };

    let addressRows = null;

    if (this.state.addresses) {
      let addresses = this.state.addresses;
      addressRows = [];

      for (var i = 0; i < NumPathsPerPage; i++) {
        let addressInfo = addresses[this.state.page * NumPathsPerPage + i];
        addressRows.push(renderDataRow(addressInfo));
      }

      addressRows = <React.Fragment>{addressRows}</React.Fragment>;
    }

    let showPrevButton = this.state.page > 0;
    let showNextButton = true;
    let prevButton = false;
    let nextButton = false;

    showNextButton = true;

    if (showPrevButton) {
      prevButton = (
        <a
          className="ExtraWalletReceiveAddressesModal__footer-button"
          onClick={this.handlePrevPageClick}
        >
          {'< Previous'}
        </a>
      );
    } else {
      prevButton = <div />;
    }

    if (showNextButton) {
      nextButton = (
        <a
          className="ExtraWalletReceiveAddressesModal__footer-button"
          onClick={this.handleNextPageClick}
        >
          {'Next >'}
        </a>
      );
    } else {
      nextButton = <div />;
    }

    return (
      <Modal>
        <div className="ExtraWalletReceiveAddressesModal">
          <div className="ExtraWalletReceiveAddressesModal__title">{'Select an Address'}</div>
          <div className="ExtraWalletReceiveAddressesModal__rows">{addressRows}</div>
          <div className="ExtraWalletReceiveAddressesModal__footer">
            {prevButton}
            {nextButton}
          </div>
          <GradientButton
            title="Open Wallet"
            disabled={isDisabled}
            onClick={this.handleUnlockWalletClick}
          />
        </div>
      </Modal>
    );
  }
}
