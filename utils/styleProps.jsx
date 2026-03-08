export const getOuterYStackProps = (mode) => ({
  flex: 1,
  alignItems: "center",
  justifyContent: mode ? "space-between" : "flex-start",
  backgroundColor: "$neutral1",
  width: "90%",
  paddingTop: "$3",
  paddingBottom: "$3",
});

export const midYStackProps = {
  flex: 1,
  justifyContent: "space-between",
  width: "100%",
  gap: "$8",
};

export const getTextProps = (mode) => ({
  width: mode ? "100%" : "90%",
  fontSize: "$6",
  color: "$neutral13",
  fontWeight: "$1",
  marginBottom: "$6",
  paddingTop: "$4",
  textAlign: "flex-start",
  fontFamily: "$heading",
});

export const buttonProps = {
  backgroundColor: "#28282C",
  color: "white",
  border: "none",
  borderRadius: "12px",
  padding: "5px 10px",
  cursor: "pointer",
  fontSize: "1rem",
};

export const messageXStackProps = {
  justifyContent: "flex-start",
  alignItems: "center",
  paddingLeft: "$2",
  width: "100%",
  height: "$12",
  backgroundColor: "$neutral3",
  borderRadius: "$4",
  paddingHorizontal: "$2",
};
