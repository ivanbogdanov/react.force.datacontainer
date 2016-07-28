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
  smartSyncStore,
  utils,
  metaContext,
  getMetadataByType,
  requestWithTypeAndId
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

const getShortId = (id) => {
  if(id && id.length>15){
    return id.substring(0,15);
  }
  return id;
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

const notifyMetaContext = (ctx) => {
  return;
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

smartSyncStore.addListener(notifySync);

module.exports = React.createClass ({
  shortId:null,
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
    sobj: React.PropTypes.object,
    sobjExt: React.PropTypes.object,
    compactLayout: React.PropTypes.object,
    defaultLayout: React.PropTypes.object,
    doRefresh: React.PropTypes.func,
    refreshedDate: React.PropTypes.instanceOf(Date),
    compactTitle: React.PropTypes.string,
    compactSummary: React.PropTypes.array
  },
  getInitialState(){
    return {
      sobj:this.props.sobj?this.props.sobj:{Name:' ',attributes:{}},
      sobjExt:{compactTitle:'',compactSummary:[]},
      ctx:{},
      compactLayout:{},
      defaultLayout:{},
      loading:false,
      refreshedDate: new Date(),
      compactTitle:'',
      compactSummary:[]
    };
  },
  getChildContext() {
    return {
      sobj: this.state.sobj,
      sobjExt: this.state.sobjExt,
      compactLayout:this.state.compactLayout,
      defaultLayout:this.state.defaultLayout,
      doRefresh:this.handleRefresh,
      refreshedDate: this.state.refreshedDate,
      compactTitle: this.state.compactTitle,
      compactSummary: this.state.compactSummary
    };
  },
  componentDidMount(){
    subscribe(this);

    this.shortId = getShortId(this.props.id);
    this.getData(false);
  },
  componentWillUnmount(){
    unsubscribe(this);
  },
  handleRefresh(){
//    this.getData(true);
    //requestWithTypeAndId(this.props.type, this.props.id);
    requestWithTypeAndId(this.props.type, this.props.id);

    this.setState({loading:true});
  },
/*
  extendSobj(){
    if(this.state.ctx && this.state.ctx.type && this.state.sobj){

      const sobj = this.state.sobj;
      const ctx = this.state.ctx;

      if(sobj && sobj.attributes){
        const compactTitle = utils.getCompactTitle(sobj, ctx.compactLayout._extra.titleFieldNames);

        const compactSummary = utils.getCompactSummary(sobj, ctx.compactLayout._extra.titleFieldNames, ctx.compactLayout._extra.fieldNames);

        this.setState({
          refreshedDate: new Date(),
          sobjExt: {
            compactTitle: compactTitle,
            compactSummary: compactSummary
          }
        });
      }
    }
  },
*/
  getSobjExt(sobj,ctx){
    if(ctx && sobj.Id){
      if(sobj && ctx.compactLayout){
        const compactTitle = utils.getCompactTitle(sobj, ctx.compactLayout._extra.titleFieldNames);
        const compactSummary = utils.getCompactSummary(sobj, ctx.compactLayout._extra.titleFieldNames, ctx.compactLayout._extra.fieldNames);
        return {
          compactTitle: compactTitle,
          compactSummary: compactSummary
        };
      }
    }
    return;
  },

  updateSyncedSobj(sobj,ctx){
    const sobjExt = this.getSobjExt(sobj,ctx);
    this.setState({
      sobj:sobj?sobj:this.state.sobj,
      sobjExt:sobjExt?sobjExt:this.state.sobjExt,
      ctx:ctx?ctx:this.state.ctx,
      compactLayout:ctx?ctx.compactLayout:this.state.compactLayout,
      defaultLayout:ctx?ctx.defaultLayout:this.state.defaultLayout,
      loading:sobj?false:this.state.loading,
      refreshedDate: new Date()
    });
  },
  updateMetaContext(ctx){
//    updateSyncedSobj(null,ctx);
  },
  handleDataLoad(){
    if(this.props.onData){
      this.props.onData({
        sobj:this.state.sobj,
        compactLayout:this.state.compactLayout
      });
    }
  },

  getData(nocache) {
    this.setState({loading:true});
    if(!this.props.type || !this.props.id){
      return;
    }


    getMetadataByType({type:this.props.type})
    .then((ctx)=>{
      smartSyncStore.getByTypeAndId(this.props.type,this.props.id,nocache,(sobj)=>{
        if(sobj){
          this.updateSyncedSobj(sobj,ctx);
        }
      });

    });

  },

  render() {
    return (
      <this.props.wrapper style={this.props.style}>
        {this.state.loading?<View></View>:this.props.children}
      </this.props.wrapper>
    )
  },
  componentWillReceiveProps(newProps){
    if(this.props.refreshDate !== newProps.refreshDate){
//      this.getInfo();
      this.getData();
    }
  },

  shouldComponentUpdate(nextProps, nextState){
    if(!this.props.update){
      return false;
    }

//    if(this.state.loading !== nextState.loading){
//      return true;
//    }

    if(this.props.type !== nextProps.type){
      return true;
    }

    if(this.state.refreshedDate !== nextState.refreshedDate){
      return true;
    }

    if(this.state.sobj.LastModifiedDate === nextState.sobj.LastModifiedDate){
      return false;
    }

    if(!shallowEqual(this.state.sobj, nextState.sobj)){
      return true;
    }

    return false;

  }
});
