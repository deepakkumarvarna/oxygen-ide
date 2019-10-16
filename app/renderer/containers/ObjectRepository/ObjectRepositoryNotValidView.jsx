/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
// @flow
import React, { PureComponent, Fragment } from 'react';
import styled from '@emotion/styled';
import { Icon } from 'antd';

import FlexColumn from '../../components/core/FlexColumn';
import Panel from '../../components/Panel';
import ScrollContainer from '../../components/ScrollContainer';
import ObjectTree from './ObjectTree';
import SearchRow from './SearchRow';
import ObjectEditor from './ObjectEditor';
import AddToRootRow from './AddToRootRow';

type Props = {
  tree: null | object,
  active: null | object,
};

export default class ObjectRepositoryNotValidView extends PureComponent<Props> {
  constructor(props: Props) {
    super(props: Props);
    this.state = {
        searchResults: []
    };

     this.inputRef = React.createRef();
  }

  static Container = styled(FlexColumn)(props => ({
    height: '100vh',
    flexShrink: 0,
    padding: props.floating ? 10 : 0,
    //borderBottom: props.collapsed ? 'none' : BORDER,
  }));

  onSelectNode(path) {
    this.props.setActive(path);
  }

  setSearchResults = searchResults => {
    this.setState({
        searchResults: searchResults
    })
  }

  closeSelectedObject = () => {
    const { closeActive } = this.props;
    if(closeActive){
      closeActive();
    }
  }

  closeObjectRepository= () => {
    const { clearObjectRepositoryFile } = this.props;
    if(clearObjectRepositoryFile){
      clearObjectRepositoryFile();
    }
  }
  
  render() {
      const { tree, active, name, selectedObject, setActive } = this.props;
      let repoPanelTitle = 'Repository';
      let editorPanelTitle = 'Object';
      if (name && name !== '') {
          repoPanelTitle += ` - ${name}`;
      }
      if (selectedObject && selectedObject.name !== '') {
        editorPanelTitle += ` - ${selectedObject.name}`;
      }

      const editorPanelTitleWrap = (
        <Fragment>
          {editorPanelTitle} 
          <div onClick={this.closeSelectedObject} className={`header-control`}>
            <Icon type="close" />
          </div>
        </Fragment>
      );

      const repoPanelTitleWrap = (
        <Fragment>
          {repoPanelTitle} 
          <div onClick={this.closeObjectRepository} className={`header-control`}>
            <Icon type="close" />
          </div>
        </Fragment>
      );

      return (
        <ObjectRepositoryNotValidView.Container>
            <Panel 
                header={ repoPanelTitleWrap }
                scroller
                scrollWrapperClass="tree-wrapper tree-wrapper-half"
                scrollRefresh={ this.props.refreshScroll }
                scrollVerticalOnly
            >
              <p>Object Repository is not valid</p>
            </Panel>
        </ObjectRepositoryNotValidView.Container>
      );    
  }
}
