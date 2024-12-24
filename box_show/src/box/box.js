import React from "react";

const IssuesAndTodos = () => {
  // 打开 GitHub 链接
  const openGitHub = () => {
    window.open("https://github.com/L1TangDingZhen/BOX_P", "_blank");
  };

  // 跳转到 /back 路径
  const goToBack = () => {
    window.location.href = "/back";
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>问题和代办列表</h1>

      {/* 按钮组 */}
      <div style={styles.buttonGroup}>
        <button style={styles.button} onClick={openGitHub}>
          访问 GitHub 仓库
        </button>
        <button style={styles.button} onClick={goToBack}>
          访问 /back 链接
        </button>
      </div>

      {/* 问题列表 */}
      <div style={styles.section}>
        <h2 style={styles.subHeader}>问题</h2>
        <ul style={styles.list}>
          <li style={styles.strikethrough}>x, y, z 定义问题</li>
          <li style={styles.strikethrough}>后端是否返回起始坐标</li>
          <li style={styles.strikethrough}>是否设置起始空间大小</li>
          <li style={styles.strikethrough}>移动端无法全屏</li>
          <li style={styles.strikethrough}>全屏按钮需要优化位置</li>
          <li style={styles.strikethrough}>长方体尺寸有验证是否冲突，！但起始位置没有验证（没有验证加入长方体后位置是否超出空间大小</li>
          <li>超大数值会卡住</li>

        </ul>
      </div>

      <div style={styles.section}>
        <h2 style={styles.subHeader}>待商讨</h2>
        <ul style={styles.list}>
          <li style={styles.strikethrough}>空间的xyz是否取最大值当作数值或者任由输入</li>
        </ul>
      </div>

      {/* 代办事项列表 */}
      <div style={styles.section}>
        <h2 style={styles.subHeader}>代办</h2>
        <ul style={styles.list}>
          <li>用作分层的进度条</li>
          <li style={styles.strikethrough}>拖拽？</li>
          <li>前一个物体变为灰色</li>
          <li>三视图角度</li>
          <li>物理的放置顺序和列表</li>
          <li>是否两个进度条，一个用作排放顺序，一个用作层数控制</li>
        </ul>
      </div>
    </div>
  );
};

// 样式
const styles = {
  container: {
    maxWidth: "800px",
    margin: "50px auto",
    padding: "20px",
    backgroundColor: "#f9f9f9",
    borderRadius: "8px",
    boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
    fontFamily: "Arial, sans-serif",
    color: "#333",
  },
  header: {
    textAlign: "center",
    color: "#0078d4",
  },
  buttonGroup: {
    display: "flex",
    justifyContent: "center",
    gap: "20px",
    marginBottom: "20px",
  },
  button: {
    padding: "10px 20px",
    fontSize: "16px",
    backgroundColor: "#0078d4",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  section: {
    marginTop: "20px",
  },
  subHeader: {
    color: "#444",
  },
  list: {
    listStyle: "square",
    marginLeft: "20px",
  },
  // 添加 strikethrough 样式
  strikethrough: {
    textDecoration: "line-through",
  },
};


export default IssuesAndTodos;



// 3. 检查设备特性
// 在移动设备上，触摸事件可能受到其他浏览器行为（如滚动、双指缩放等）的影响。可以通过 event.preventDefault() 禁用默认行为。

// 示例：

// javascript
// 复制代码
// const handleTouchStart = (e) => {
//   e.preventDefault(); // 禁用默认行为
//   isMouseDown.current = true;
//   mousePosition.current = {
//     x: e.touches[0].clientX,
//     y: e.touches[0].clientY,
//   };
// };
