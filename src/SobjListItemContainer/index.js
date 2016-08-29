/*
 * Copyright (c) 2016, salesforce.com, inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided
 * that the following conditions are met:
 *
 * Redistributions of source code must retain the above copyright notice, this list of conditions and the
 * following disclaimer.
 *
 * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and
 * the following disclaimer in the documentation and/or other materials provided with the distribution.
 *
 * Neither the name of salesforce.com, inc. nor the names of its contributors may be used to endorse or
 * promote products derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
 * PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
 * TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

import React, {
  Text,
  View
} from 'react-native';

import shallowEqual from 'shallowequal';
import findIndex from 'lodash.findindex';

import {
  getByTypeAndId,
//  smartSyncStore,
  utils,
  metaContext,
  getMetadataByType,
  requestWithTypeAndId,
  addSobjStoreListener,
  addContextListener,
  requestSobjWithTypeAndId,
  requestMetadataByType,
  refreshWithTypeAndId
} from 'react.force.data';

const subscribers = [];

const subscribe = (comp)=>{
  subscribers.push(comp)
};

const unsubscribe = (comp) => {
  const i = subscribers.indexOf(comp);
  if(i != -1) {
    subscribers.splice(i, 1);
  }
};

const notifySync = (sobjs,ctx) => {
  if(subscribers && subscribers.length){
    subscribers.forEach((subscriber)=>{
      if(subscriber && subscriber.props && subscriber.props.id){
        const sobj = sobjs[subscriber.shortId];
        if(sobj && sobj.attributes && sobj.attributes.type){
          subscriber.updateSyncedSobj(sobj,ctx);
        }
      }
    });
  }
};

const sobjStoreListener = (sobjs) => {
  if(subscribers && subscribers.length){
    subscribers.forEach((subscriber)=>{
      if(subscriber && subscriber.props && subscriber.props.id){
        const sobj = sobjs[utils.normalizeId(subscriber.props.id)];
        if(sobj && sobj.attributes && sobj.attributes.type){
          subscriber.updateSyncedSobj(sobj);
        }
      }
    });
  }
};

const contextListener = (ctx) => {
  notifyMetaContext(ctx);
};

const notifyMetaContext = (ctx) => {
  if(ctx && ctx.type){
    if(subscribers && subscribers.length){
      subscribers.forEach((subscriber)=>{
        if(subscriber && subscriber.props && subscriber.props.type){
          if(subscriber.props.type === ctx.type){
            subscriber.updateMetaContext(ctx);
          }
        }
      });
    }
  }

};

addContextListener(contextListener);

module.exports = React.createClass ({
  shortId:null,
  normalizedId:null,
  getDefaultProps(){
    return {
      type:null,
      id:null,
      refreshDate:new Date(),
      update:true,
      style:{},
      wrapper:View
    };
  },
  childContextTypes: {
    compactLayout: React.PropTypes.object,
    defaultLayout: React.PropTypes.object,
    theme: React.PropTypes.object,
    describe: React.PropTypes.object,
    listViews: React.PropTypes.object,
  },
  getInitialState(){
    return {
      theme:{},
      describe:{},
      loading:false,
    };
  },
  getChildContext() {
    return {
      theme:this.state.theme,
      describe:this.state.describe,
    };
  },
  componentDidMount(){
    subscribe(this);
    this.getData(false);
  },
  componentWillUnmount(){
    unsubscribe(this);
  },

  updateMetaContext(ctx){
    this.setState({
      theme:ctx.theme,
      describe:ctx.describe,
      loading:false,
    });
  },

  getData(nocache) {
    this.setState({loading:true});
    if(!this.props.type){
      return;
    }
    requestMetadataByType(this.props.type);
  },

  render() {
    return (
      <this.props.wrapper style={this.props.style}>
        { this.state.loading?<Text>LOADING</Text>:this.props.children }
      </this.props.wrapper>
    )
  },

  componentDidUpdate( prevProps, prevState ){
    if(this.props.refreshDate !== prevProps.refreshDate){
      this.getData();
    }
  },

  shouldComponentUpdate(nextProps, nextState){
    if(this.props.type !== nextProps.type){
      return true;
    }
    if(this.state.loading !== nextState.loading){
      return true;
    }
    return false;
  }

});
