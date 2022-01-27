import { Container, CssBaseline, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Fragment } from 'react';


const PanelWrapper = styled(Paper)(({ theme }) => ({
  ...theme.typography.body2,
  textAlign: 'center',
  color: theme.palette.text.secondary,
  minHeight: '80vh',
  lineHeight: '60px',
  padding: '1rem',
  marginTop: '2%',
  marginBottom: '2%',
  background: '#5ae7ab'
}));

function Panel({ children }) {
  return (
    <>
      <CssBaseline />
      <Container maxWidth="lg">
        <PanelWrapper elevation={4}>
          <Fragment>
            {children}
          </Fragment>
        </PanelWrapper>
      </Container>
    </>
  );
}

export default Panel;