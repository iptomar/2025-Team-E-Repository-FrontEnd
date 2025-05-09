import React from "react";
import iptLogo from "../../assets/ipt-logo-full.png";
import "./Loading.scss";

const Loading = ({ text = "A carregar..." }) => (
    <div className="ipt-loading">
        <img src={iptLogo} alt="IPT Logo" className="ipt-loading-logo" />
        <div className="ipt-loading-spinner" />
        <span className="ipt-loading-text">{text}</span>
    </div>
);

export default Loading;
