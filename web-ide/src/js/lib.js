// React + htm(JSX 없는 태그드 템플릿 JSX)는 index.html 에서 UMD <script> 태그로 미리 로드된
// 전역(window.React / window.ReactDOM / window.htm)을 재수출합니다.
// (Claude Artifact 등 CSP가 있는 배포 환경에서도 그대로 동작하도록 ESM CDN import 대신
//  cdnjs/jsdelivr UMD 빌드 + 전역 변수 방식을 사용합니다.)
var React = window.React;
var ReactDOM = window.ReactDOM;
var html = window.htm.bind(React.createElement);

export { React, ReactDOM, html };
export const { useState, useEffect, useRef, useReducer, useContext, useCallback, useMemo, createContext } = React;
