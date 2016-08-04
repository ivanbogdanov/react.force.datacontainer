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
  getListViewsByType,
  requestWithTypeAndId
} from 'react.force.data';


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


module.exports = React.createClass ({

  getDefaultProps(){
    return {
      type:null,
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
    doRefresh: React.PropTypes.func,
    refreshedDate: React.PropTypes.instanceOf(Date),
  },
  getInitialState(){
    return {
      ctx:{},
      compactLayout:{},
      defaultLayout:{},
      theme:{},
      describe:{},
      listViews:{},
      loading:false,
      refreshedDate: new Date(),
    };
  },
  getChildContext() {
    return {
      compactLayout:this.state.compactLayout,
      defaultLayout:this.state.defaultLayout,
      theme:this.state.theme,
      describe:this.state.describe,
      listViews:this.state.listViews,
      doRefresh:this.handleRefresh,
      refreshedDate: this.state.refreshedDate,
    };
  },
  componentDidMount(){
    this.getData(false);
  },

  updateContext(ctx){
    this.setState({
      ctx:ctx?ctx:this.state.ctx,
      compactLayout:ctx?ctx.compactLayout:this.state.compactLayout,
      defaultLayout:ctx?ctx.defaultLayout:this.state.defaultLayout,
      theme:ctx?ctx.theme:this.state.theme,
      describe:ctx?ctx.describe:this.state.describe,
      listViews:ctx?ctx.listViews:this.state.listViews,
      loading:ctx.listViews?false:this.state.loading,
      refreshedDate: new Date()
    });
  },
  updateMetaContext(ctx){
//    updateSyncedSobj(null,ctx);
  },

  getData(nocache) {
    this.setState({loading:true});

    if(!this.props.type){
      return;
    }

    getListViewsByType({type:this.props.type})
    .then((ctx)=>{
      this.updateContext(ctx);
    });

  },

  render() {
    return (
      <this.props.wrapper style={this.props.style}>
        {this.state.loading?<View></View>:this.props.children}
      </this.props.wrapper>
    )
  },

  componentDidUpdate(newProps){
    if(this.props.type !== newProps.type ){
      this.getData();
    }
  },

});
